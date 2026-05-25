import type {
  NamespaceConfigPutRequest,
  NamespaceConfigView,
  RouteConfig,
  UpstreamPoolConfig,
} from "@/lib/api-types";

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

function clonePool(pool: UpstreamPoolConfig): UpstreamPoolConfig {
  return {
    ...pool,
    upstreams: [...pool.upstreams],
    health_check: pool.health_check ? { ...pool.health_check } : undefined,
  };
}

function cloneConfig(config: NamespaceConfigView): NamespaceConfigView {
  return {
    ...config,
    routes: config.routes.map(cloneRoute),
    upstream_pools: Object.fromEntries(
      Object.entries(config.upstream_pools).map(([id, pool]) => [id, clonePool(pool)]),
    ),
  };
}

export function toPutRequest(config: NamespaceConfigView): NamespaceConfigPutRequest {
  return {
    routes: config.routes.map(cloneRoute),
    upstream_pools: Object.fromEntries(
      Object.entries(config.upstream_pools).map(([id, pool]) => [id, clonePool(pool)]),
    ),
  };
}

export function addRouteToConfig(config: NamespaceConfigView, route: RouteConfig): NamespaceConfigView {
  if (config.routes.some((item) => item.id === route.id)) {
    throw new Error(`Route id already exists: ${route.id}`);
  }

  const next = cloneConfig(config);
  next.routes.push(cloneRoute(route));
  return next;
}

export function upsertRouteInConfig(
  config: NamespaceConfigView,
  previousRouteId: string,
  route: RouteConfig,
): NamespaceConfigView {
  const existingIndex = config.routes.findIndex((item) => item.id === previousRouteId);

  if (existingIndex === -1) {
    return addRouteToConfig(config, route);
  }

  const duplicate = config.routes.some((item, index) => index !== existingIndex && item.id === route.id);

  if (duplicate) {
    throw new Error(`Route id already exists: ${route.id}`);
  }

  const next = cloneConfig(config);
  next.routes[existingIndex] = cloneRoute(route);
  return next;
}

export function deleteRouteFromConfig(config: NamespaceConfigView, routeId: string): NamespaceConfigView {
  const next = cloneConfig(config);
  next.routes = next.routes.filter((route) => route.id !== routeId);
  return next;
}

export function upsertPoolInConfig(
  config: NamespaceConfigView,
  poolId: string,
  pool: UpstreamPoolConfig,
): NamespaceConfigView {
  const next = cloneConfig(config);
  next.upstream_pools[poolId] = clonePool(pool);
  return next;
}

export function renamePoolInConfig(
  config: NamespaceConfigView,
  previousPoolId: string,
  nextPoolId: string,
  pool: UpstreamPoolConfig,
): NamespaceConfigView {
  if (!Object.prototype.hasOwnProperty.call(config.upstream_pools, previousPoolId)) {
    throw new Error(`Upstream pool id does not exist: ${previousPoolId}`);
  }

  if (previousPoolId !== nextPoolId && config.upstream_pools[nextPoolId]) {
    throw new Error(`Upstream pool id already exists: ${nextPoolId}`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[previousPoolId];
  next.upstream_pools[nextPoolId] = clonePool(pool);
  next.routes = next.routes.map((route) =>
    route.upstream_pool === previousPoolId ? { ...route, upstream_pool: nextPoolId } : route,
  );
  return next;
}

export function deletePoolFromConfig(config: NamespaceConfigView, poolId: string): NamespaceConfigView {
  const referencedRoute = config.routes.find((route) => route.upstream_pool === poolId);

  if (referencedRoute) {
    throw new Error(`Cannot delete upstream pool ${poolId} because route ${referencedRoute.id} uses it`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[poolId];
  return next;
}
