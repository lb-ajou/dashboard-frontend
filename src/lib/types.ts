// Types based on CONFIG_SPEC.md

export interface Config {
  routes: Route[]
  upstream_pools: Record<string, UpstreamPool>
}

export interface Route {
  id: string
  enabled: boolean
  match: RouteMatch
  upstream_pool: string
}

export interface RouteMatch {
  hosts: string[]
  path?: PathMatch
}

export type PathMatchType = 'exact' | 'prefix' | 'regex'

export interface PathMatch {
  type: PathMatchType
  value: string
}

export interface UpstreamPool {
  upstreams: string[]
  health_check?: HealthCheck
}

export interface HealthCheck {
  path: string
  interval: string  // Duration (e.g., "30s")
  timeout: string   // Duration (e.g., "3s")
  expect_status: number
}

// Form data types for creating/editing
export interface RouteFormData {
  id: string
  enabled: boolean
  hosts: string[]
  pathType: PathMatchType | ''
  pathValue: string
  upstream_pool: string
}

export interface UpstreamPoolFormData {
  id: string
  upstreams: string[]
  health_check_enabled: boolean
  health_check_path: string
  health_check_interval: string
  health_check_timeout: string
  health_check_expect_status: number
}

// Helper functions
export function routeToFormData(route: Route): RouteFormData {
  return {
    id: route.id,
    enabled: route.enabled,
    hosts: route.match.hosts,
    pathType: route.match.path?.type ?? '',
    pathValue: route.match.path?.value ?? '',
    upstream_pool: route.upstream_pool
  }
}

export function formDataToRoute(formData: RouteFormData): Route {
  const route: Route = {
    id: formData.id,
    enabled: formData.enabled,
    match: {
      hosts: formData.hosts.filter(h => h.trim() !== '')
    },
    upstream_pool: formData.upstream_pool
  }

  if (formData.pathType && formData.pathValue) {
    route.match.path = {
      type: formData.pathType as PathMatchType,
      value: formData.pathValue
    }
  }

  return route
}

export function poolToFormData(id: string, pool: UpstreamPool): UpstreamPoolFormData {
  return {
    id,
    upstreams: pool.upstreams,
    health_check_enabled: !!pool.health_check,
    health_check_path: pool.health_check?.path ?? '/health',
    health_check_interval: pool.health_check?.interval ?? '30s',
    health_check_timeout: pool.health_check?.timeout ?? '3s',
    health_check_expect_status: pool.health_check?.expect_status ?? 200
  }
}

export function formDataToPool(formData: UpstreamPoolFormData): UpstreamPool {
  const pool: UpstreamPool = {
    upstreams: formData.upstreams.filter(u => u.trim() !== '')
  }

  if (formData.health_check_enabled) {
    pool.health_check = {
      path: formData.health_check_path,
      interval: formData.health_check_interval,
      timeout: formData.health_check_timeout,
      expect_status: formData.health_check_expect_status
    }
  }

  return pool
}
