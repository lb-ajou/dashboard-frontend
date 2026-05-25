export type ConfigStore = "file" | "raft" | string;

export type RaftState =
  | "disabled"
  | "leader"
  | "follower"
  | "candidate"
  | "shutdown"
  | "unknown"
  | string;

export type QuorumStatus = "available" | "unavailable" | "unknown" | "disabled" | string;
export type ClusterMemberRole = "voter" | "nonvoter" | "staging" | "unknown" | string;

export type RouteAlgorithm =
  | "round_robin"
  | "sticky_cookie"
  | "5_tuple_hash"
  | "least_connection"
  | string;

export type PathKind = "exact" | "prefix" | "regex" | "any" | "unknown" | string;
export type PathMatchType = "exact" | "prefix" | "regex";

export interface ProjectionView {
  status: "ok" | "degraded" | string;
  last_error?: string;
}

export interface StatusNodeView {
  id?: string;
  config_store: ConfigStore;
  proxy_listen_addr: string;
  dashboard_listen_addr: string;
  applied_at: string;
  projection: ProjectionView;
}

export interface StatusRaftView {
  enabled: boolean;
  state: RaftState;
  is_leader: boolean;
  leader_id?: string;
  leader_address?: string;
  has_leader: boolean;
  quorum_status: QuorumStatus;
}

export interface VIPStatusView {
  enabled: boolean;
  interface?: string;
  address?: string;
  owned: boolean;
  last_error?: string;
}

export interface StatusRuntimeView {
  route_count: number;
  upstream_pool_count: number;
  target_count: number;
  healthy_target_count: number;
  unhealthy_target_count: number;
}

export interface StatusView {
  node: StatusNodeView;
  raft: StatusRaftView;
  vip: VIPStatusView;
  runtime: StatusRuntimeView;
}

export interface RuntimeNodeView {
  id?: string;
  config_store: ConfigStore;
}

export interface RuntimeConfigSourceView {
  source: string;
  path?: string;
  name?: string;
  route_count: number;
  upstream_pool_count: number;
}

export interface RuntimePathMatcherView {
  kind: PathKind;
  value?: string;
}

export interface RuntimeRouteView {
  global_id: string;
  local_id: string;
  source: string;
  enabled: boolean;
  hosts: string[];
  path: RuntimePathMatcherView;
  algorithm: RouteAlgorithm;
  upstream_pool: string;
}

export interface RuntimeTargetView {
  address: string;
  healthy: boolean;
  last_checked_at?: string;
  last_error?: string;
  active_connections: number;
}

export interface RuntimeHealthCheckView {
  path: string;
  interval: string;
  timeout: string;
  expect_status: number;
}

export interface RuntimeUpstreamView {
  global_id: string;
  local_id: string;
  source: string;
  targets: RuntimeTargetView[];
  health_check?: RuntimeHealthCheckView;
}

export interface RuntimeView {
  applied_at: string;
  node: RuntimeNodeView;
  config_sources: RuntimeConfigSourceView[];
  routes: RuntimeRouteView[];
  upstreams: RuntimeUpstreamView[];
}

export interface ClusterLeaderView {
  id?: string;
  address?: string;
}

export interface ClusterLocalView {
  id?: string;
  address?: string;
  state?: RaftState;
  last_log_index?: string;
  commit_index?: string;
  applied_index?: string;
  term?: string;
}

export interface ClusterMemberView {
  id: string;
  address: string;
  role: ClusterMemberRole;
  is_leader: boolean;
}

export interface ClusterView {
  enabled: boolean;
  quorum_status?: QuorumStatus;
  leader: ClusterLeaderView;
  local: ClusterLocalView;
  members: ClusterMemberView[];
}

export interface HealthCheckConfig {
  path: string;
  interval: string;
  timeout: string;
  expect_status: number;
}

export interface UpstreamPoolConfig {
  upstreams: string[];
  health_check?: HealthCheckConfig;
}

export interface PathMatchConfig {
  type: PathMatchType;
  value: string;
}

export interface RouteMatchConfig {
  hosts: string[];
  path?: PathMatchConfig;
}

export interface RouteConfig {
  id: string;
  enabled: boolean;
  match: RouteMatchConfig;
  algorithm?: RouteAlgorithm;
  upstream_pool: string;
}

export interface NamespaceConfigView {
  namespace: string;
  exists: boolean;
  routes: RouteConfig[];
  upstream_pools: Record<string, UpstreamPoolConfig>;
  applied_at?: string;
}

export interface NamespaceConfigPutRequest {
  routes: RouteConfig[];
  upstream_pools: Record<string, UpstreamPoolConfig>;
}

export interface NamespaceView {
  namespace: string;
  path: string;
  exists: boolean;
  route_count: number;
  upstream_pool_count: number;
}

export interface NamespaceListView {
  items: NamespaceView[];
  default_namespace: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface APIErrorResponse {
  message: string;
  code?: string;
  leader_address?: string;
  errors?: ValidationError[];
}
