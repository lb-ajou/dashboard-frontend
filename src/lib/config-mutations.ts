import type { ConfigRequest, ConfigView, RouteConfig, UpstreamPool } from "@/lib/api-types";

function cloneRoute(route: RouteConfig): RouteConfig {
  return {
    ...route,
    match: {
      ...route.match,
      hosts: [...route.match.hosts],
      path: route.match.path ? { ...route.match.path } : undefined,
    },
  };
}

function cloneUpstreamPool(pool: UpstreamPool): UpstreamPool {
  return {
    ...pool,
    upstreams: [...pool.upstreams],
    health_check: pool.health_check ? { ...pool.health_check } : undefined,
  };
}

function cloneConfig(config: ConfigView): ConfigView {
  return {
    ...config,
    routes: config.routes.map(cloneRoute),
    upstream_pools: Object.fromEntries(
      Object.entries(config.upstream_pools).map(([poolId, pool]) => [poolId, cloneUpstreamPool(pool)]),
    ),
  };
}

export function toReplaceConfigRequest(config: ConfigView): ConfigRequest {
  const next = cloneConfig(config);

  return {
    routes: next.routes,
    upstream_pools: next.upstream_pools,
  };
}

export function addRoute(config: ConfigView, route: RouteConfig): ConfigView {
  if (config.routes.some((existingRoute) => existingRoute.id === route.id)) {
    throw new Error(`Route ${route.id} already exists`);
  }

  const next = cloneConfig(config);
  next.routes.push(cloneRoute(route));
  return next;
}

export function replaceRoute(
  config: ConfigView,
  previousRouteId: string,
  route: RouteConfig,
): ConfigView {
  const routeIndex = config.routes.findIndex((existingRoute) => existingRoute.id === previousRouteId);

  if (routeIndex === -1) {
    throw new Error(`Route ${previousRouteId} does not exist`);
  }

  if (config.routes.some((existingRoute, index) => index !== routeIndex && existingRoute.id === route.id)) {
    throw new Error(`Route ${route.id} already exists`);
  }

  const next = cloneConfig(config);
  next.routes[routeIndex] = cloneRoute(route);
  return next;
}

export function deleteRoute(config: ConfigView, routeId: string): ConfigView {
  const next = cloneConfig(config);
  next.routes = next.routes.filter((route) => route.id !== routeId);
  return next;
}

export function addUpstreamPool(
  config: ConfigView,
  poolId: string,
  pool: UpstreamPool,
): ConfigView {
  if (config.upstream_pools[poolId]) {
    throw new Error(`Upstream pool ${poolId} already exists`);
  }

  const next = cloneConfig(config);
  next.upstream_pools[poolId] = cloneUpstreamPool(pool);
  return next;
}

export function replaceUpstreamPool(
  config: ConfigView,
  previousPoolId: string,
  nextPoolId: string,
  pool: UpstreamPool,
): ConfigView {
  if (!config.upstream_pools[previousPoolId]) {
    throw new Error(`Upstream pool ${previousPoolId} does not exist`);
  }

  if (previousPoolId !== nextPoolId && config.upstream_pools[nextPoolId]) {
    throw new Error(`Upstream pool ${nextPoolId} already exists`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[previousPoolId];
  next.upstream_pools[nextPoolId] = cloneUpstreamPool(pool);
  next.routes = next.routes.map((route) =>
    route.upstream_pool === previousPoolId ? { ...route, upstream_pool: nextPoolId } : route,
  );
  return next;
}

export function deleteUpstreamPool(config: ConfigView, poolId: string): ConfigView {
  const referencedRoute = config.routes.find((route) => route.upstream_pool === poolId);

  if (referencedRoute) {
    throw new Error(`Cannot delete ${poolId} because route ${referencedRoute.id} uses it`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[poolId];
  return next;
}
