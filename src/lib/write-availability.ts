import type { StatusView } from "./api-types";

export interface WriteAvailability {
  canWrite: boolean;
  reason?: string;
  leaderAddress?: string;
  setupRequired?: boolean;
}

const WRITABLE_QUORUM_STATUSES = new Set(["healthy", "available"]);

export function getWriteAvailability(status?: StatusView): WriteAvailability {
  if (!status) {
    return { canWrite: false, reason: "Status is still loading." };
  }

  if (status.node.projection.last_error?.includes("cluster_not_configured")) {
    return {
      canWrite: false,
      reason: "Cluster setup is required before configuration can be saved.",
      setupRequired: true,
    };
  }

  if (!status.raft.enabled) {
    return { canWrite: true, reason: undefined };
  }

  if (!status.raft.has_leader) {
    return { canWrite: false, reason: "No cluster leader is currently available." };
  }

  if (status.raft.quorum_status && !WRITABLE_QUORUM_STATUSES.has(status.raft.quorum_status)) {
    return {
      canWrite: false,
      reason: "Cluster quorum is not healthy. Configuration changes are temporarily unavailable.",
      leaderAddress: status.raft.leader_address,
    };
  }

  if (!status.raft.is_leader) {
    return {
      canWrite: false,
      reason: "Configuration writes must be sent to the raft leader.",
      leaderAddress: status.raft.leader_address,
    };
  }

  return { canWrite: true, reason: undefined };
}
