import type { ClusterBootstrapRequest, ClusterRaftTimingRequest, ClusterVIPRequest, NodeJoinClusterRequest } from "@/lib/api-types";

export interface ClusterBootstrapFormValues {
  nodeId: string;
  raftAdvertiseAddr: string;
  raftBindAddr: string;
  heartbeatTimeout: string;
  electionTimeout: string;
  leaderLeaseTimeout: string;
  commitTimeout: string;
  vipInterface: string;
  vipAddress: string;
  garpCount: string;
  garpInterval: string;
  acquireDelay: string;
  releaseOnShutdown: boolean;
}

export interface NodeJoinClusterFormValues {
  nodeId: string;
  raftAdvertiseAddr: string;
  raftBindAddr: string;
  vipInterface: string;
  peers: string[];
}

function trimmed(value: string) {
  return value.trim();
}

function optionalDuration(value: string) {
  const nextValue = trimmed(value);
  return nextValue || undefined;
}

function optionalNumber(value: string) {
  const nextValue = trimmed(value);
  return nextValue ? Number(nextValue) : undefined;
}

function withDefinedValues<T extends object>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)) as Partial<T>;
}

export function requiresVipInterface(vipAddress: string, vipInterface: string) {
  return Boolean(trimmed(vipAddress) && !trimmed(vipInterface));
}

export function buildClusterBootstrapRequest(values: ClusterBootstrapFormValues): ClusterBootstrapRequest {
  const raftTiming = withDefinedValues<ClusterRaftTimingRequest>({
    heartbeat_timeout: optionalDuration(values.heartbeatTimeout),
    election_timeout: optionalDuration(values.electionTimeout),
    leader_lease_timeout: optionalDuration(values.leaderLeaseTimeout),
    commit_timeout: optionalDuration(values.commitTimeout),
  });
  const vip = withDefinedValues<ClusterVIPRequest>({
    address: trimmed(values.vipAddress),
    garp_count: optionalNumber(values.garpCount),
    garp_interval: optionalDuration(values.garpInterval),
    acquire_delay: optionalDuration(values.acquireDelay),
    release_on_shutdown: values.releaseOnShutdown ? true : undefined,
  });
  const vipInterface = trimmed(values.vipInterface);

  return {
    node_id: trimmed(values.nodeId),
    raft_advertise_addr: trimmed(values.raftAdvertiseAddr),
    ...(trimmed(values.raftBindAddr) ? { raft_bind_addr: trimmed(values.raftBindAddr) } : {}),
    ...(Object.keys(raftTiming).length ? { raft_timing: raftTiming } : {}),
    ...(vipInterface ? { vip_interface: vipInterface } : {}),
    ...(vip.address ? { vip: vip as ClusterVIPRequest } : {}),
  };
}

export function buildNodeJoinClusterRequest(values: NodeJoinClusterFormValues): NodeJoinClusterRequest {
  const vipInterface = trimmed(values.vipInterface);

  return {
    node_id: trimmed(values.nodeId),
    raft_advertise_addr: trimmed(values.raftAdvertiseAddr),
    ...(trimmed(values.raftBindAddr) ? { raft_bind_addr: trimmed(values.raftBindAddr) } : {}),
    ...(vipInterface ? { vip_interface: vipInterface } : {}),
    peers: values.peers,
  };
}
