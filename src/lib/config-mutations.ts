import type {
  NamespaceConfigPutRequest,
  NamespaceConfigView,
  RouteConfig,
  UpstreamPoolConfig,
} from "@/lib/api-types";

function cloneConfig(config: NamespaceConfigView): NamespaceConfigView {
  return {
    ...config,
    routes: config.routes.map((route) => ({
      ...route,
      match: {
        ...route.match,
        hosts: [...route.match.hosts],
        path: route.match.path ? { ...route.match.path } : undefined,
      },
    })),
    upstream_pools: Object.fromEntries(
      Object.entries(config.upstream_pools).map(([id, pool]) => [
        id,
        {
          ...pool,
          upstreams: [...pool.upstreams],
          health_check: pool.health_check ? { ...pool.health_check } : undefined,
        },
      ]),
    ),
  };
}

export function toPutRequest(config: NamespaceConfigView): NamespaceConfigPutRequest {
  return {
    routes: config.routes,
    upstream_pools: config.upstream_pools,
  };
}

export function addRouteToConfig(config: NamespaceConfigView, route: RouteConfig): NamespaceConfigView {
  if (config.routes.some((item) => item.id === route.id)) {
    throw new Error(`Route id already exists: ${route.id}`);
  }

  const next = cloneConfig(config);
  next.routes.push(route);
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
  next.routes[existingIndex] = route;
  return next;
}

export function deleteRouteFromConfig(config: NamespaceConfigView, routeId: string): NamespaceConfigView {
  return {
    ...cloneConfig(config),
    routes: config.routes.filter((route) => route.id !== routeId),
  };
}

export function upsertPoolInConfig(
  config: NamespaceConfigView,
  poolId: string,
  pool: UpstreamPoolConfig,
): NamespaceConfigView {
  const next = cloneConfig(config);
  next.upstream_pools[poolId] = pool;
  return next;
}

export function renamePoolInConfig(
  config: NamespaceConfigView,
  previousPoolId: string,
  nextPoolId: string,
  pool: UpstreamPoolConfig,
): NamespaceConfigView {
  if (previousPoolId !== nextPoolId && config.upstream_pools[nextPoolId]) {
    throw new Error(`Upstream pool id already exists: ${nextPoolId}`);
  }

  const next = cloneConfig(config);
  delete next.upstream_pools[previousPoolId];
  next.upstream_pools[nextPoolId] = pool;
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
