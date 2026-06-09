import type { PathMatchType, RouteAlgorithm, RouteConfig, UpstreamPool } from "@/lib/api-types";

export type Config = import("@/lib/api-types").ConfigView;
export type Route = RouteConfig;
export type { PathMatchType, RouteAlgorithm, UpstreamPool };
export type HealthCheck = import("@/lib/api-types").HealthCheckConfig;

export interface RouteFormData {
  id: string;
  enabled: boolean;
  hosts: string[];
  pathType: PathMatchType | "";
  pathValue: string;
  algorithm: RouteAlgorithm;
  upstream_pool: string;
}

export interface UpstreamPoolFormData {
  id: string;
  upstreams: string[];
  health_check_enabled: boolean;
  health_check_path: string;
  health_check_interval: string;
  health_check_timeout: string;
  health_check_expect_status: number;
}

export function routeToFormData(route: RouteConfig): RouteFormData {
  return {
    id: route.id,
    enabled: route.enabled,
    hosts: [...route.match.hosts],
    pathType: route.match.path?.type ?? "",
    pathValue: route.match.path?.value ?? "",
    algorithm: route.algorithm ?? "round_robin",
    upstream_pool: route.upstream_pool,
  };
}

export function formDataToRoute(formData: RouteFormData): RouteConfig {
  const route: RouteConfig = {
    id: formData.id,
    enabled: formData.enabled,
    match: {
      hosts: formData.hosts.filter((host) => host.trim() !== ""),
    },
    algorithm: formData.algorithm ?? "round_robin",
    upstream_pool: formData.upstream_pool,
  };

  if (formData.pathType && formData.pathValue) {
    route.match.path = {
      type: formData.pathType,
      value: formData.pathValue,
    };
  }

  return route;
}

export function poolToFormData(id: string, pool: UpstreamPool): UpstreamPoolFormData {
  return {
    id,
    upstreams: [...pool.upstreams],
    health_check_enabled: !!pool.health_check,
    health_check_path: pool.health_check?.path ?? "/health",
    health_check_interval: pool.health_check?.interval ?? "30s",
    health_check_timeout: pool.health_check?.timeout ?? "3s",
    health_check_expect_status: pool.health_check?.expect_status ?? 200,
  };
}

export function formDataToPool(formData: UpstreamPoolFormData): UpstreamPool {
  const pool: UpstreamPool = {
    upstreams: formData.upstreams.filter((upstream) => upstream.trim() !== ""),
  };

  if (formData.health_check_enabled) {
    pool.health_check = {
      path: formData.health_check_path,
      interval: formData.health_check_interval,
      timeout: formData.health_check_timeout,
      expect_status: formData.health_check_expect_status,
    };
  }

  return pool;
}
