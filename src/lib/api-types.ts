export type ISODateTime = string;
export type DurationString = string;
export type RouteID = string;
export type UpstreamPoolID = string;

export interface APIError {
  message: string;
  code?: APIErrorCode;
  leader_address?: string;
  errors?: ValidationError[];
}

export type APIErrorCode =
  | "invalid_request"
  | "invalid_node_id"
  | "invalid_raft_address"
  | "invalid_vip"
  | "invalid_raft_timing"
  | "not_raft_leader"
  | "cluster_not_configured"
  | "cluster_already_configured"
  | (string & {});

export interface ValidationError {
  field: string;
  message: string;
}

export interface ConfigView {
  routes: RouteConfig[];
  upstream_pools: Record<UpstreamPoolID, UpstreamPool>;
  applied_at?: ISODateTime;
}

export interface ConfigRequest {
  routes: RouteConfig[];
  upstream_pools: Record<UpstreamPoolID, UpstreamPool>;
}

export interface RouteConfig {
  id: RouteID;
  enabled: boolean;
  match: RouteMatchConfig;
  algorithm?: RouteAlgorithm;
  upstream_pool: UpstreamPoolID;
}

export interface RouteMatchConfig {
  hosts: string[];
  path?: PathMatchConfig;
}

export type RouteAlgorithm = "round_robin" | "sticky_cookie" | "5_tuple_hash" | "least_connection";

export interface PathMatchConfig {
  type: PathMatchType;
  value: string;
}

export type PathMatchType = "exact" | "prefix" | "regex";

export interface UpstreamPool {
  upstreams: string[];
  health_check?: HealthCheckConfig;
}

export interface HealthCheckConfig {
  path: string;
  interval: DurationString;
  timeout: DurationString;
  expect_status: number;
}

export interface StatusView {
  node: StatusNodeView;
  raft: StatusRaftView;
  vip: VIPStatusView;
  runtime: StatusRuntimeView;
}

export interface StatusNodeView {
  id?: string;
  proxy_listen_addr: string;
  dashboard_listen_addr: string;
  applied_at: ISODateTime;
  projection: ProjectionView;
}

export interface ProjectionView {
  status: string;
  last_error?: string;
}

export interface StatusRaftView {
  enabled: boolean;
  state: string;
  is_leader: boolean;
  leader_id?: string;
  leader_address?: string;
  has_leader: boolean;
  quorum_status: string;
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

export interface RuntimeView {
  applied_at: ISODateTime;
  routes: RuntimeRouteView[];
  upstreams: RuntimeUpstreamView[];
}

export interface RuntimeRouteView {
  id: string;
  enabled: boolean;
  hosts: string[];
  path: RuntimePathMatcherView;
  algorithm: string;
  upstream_pool: string;
}

export interface RuntimePathMatcherView {
  kind: "exact" | "prefix" | "regex" | "any" | "unknown" | (string & {});
  value?: string;
}

export interface RuntimeUpstreamView {
  id: string;
  targets: RuntimeTargetView[];
  health_check?: HealthCheckConfig;
}

export interface RuntimeTargetView {
  address: string;
  healthy: boolean;
  last_checked_at?: ISODateTime;
  last_error?: string;
  active_connections: number;
}

export interface ClusterView {
  enabled: boolean;
  quorum_status?: string;
  leader: ClusterLeaderView;
  local: ClusterLocalView;
  members: ClusterMemberView[];
  raft_timing?: ClusterRaftTimingView;
}

export interface ClusterLeaderView {
  id?: string;
  address?: string;
}

export interface ClusterLocalView {
  id?: string;
  address?: string;
  state?: string;
  last_log_index?: string;
  commit_index?: string;
  applied_index?: string;
  term?: string;
}

export interface ClusterMemberView {
  id: string;
  address: string;
  role: string;
  is_leader: boolean;
}

export interface ClusterRaftTimingView {
  heartbeat_timeout?: DurationString;
  election_timeout?: DurationString;
  leader_lease_timeout?: DurationString;
  commit_timeout?: DurationString;
}

export interface NodeClusterStatusView {
  state: NodeClusterState;
  node_id?: string;
  raft_advertise_addr?: string;
  raft_data_dir?: string;
  last_error?: string;
}

export type NodeClusterState = "unconfigured" | "clustered" | "existing_state" | "check_error" | (string & {});

export interface ClusterBootstrapRequest {
  node_id: string;
  raft_bind_addr?: string;
  raft_advertise_addr: string;
  raft_timing?: ClusterRaftTimingRequest;
  vip_interface?: string;
  vip?: ClusterVIPRequest;
}

export interface ClusterRaftTimingRequest {
  heartbeat_timeout?: DurationString;
  election_timeout?: DurationString;
  leader_lease_timeout?: DurationString;
  commit_timeout?: DurationString;
}

export interface ClusterVIPRequest {
  address: string;
  garp_count?: number;
  garp_interval?: DurationString;
  acquire_delay?: DurationString;
  release_on_shutdown?: boolean;
}

export interface NodeJoinClusterRequest {
  node_id: string;
  raft_bind_addr?: string;
  raft_advertise_addr: string;
  vip_interface?: string;
  peers: string[];
}
