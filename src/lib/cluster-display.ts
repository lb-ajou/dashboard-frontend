import type { ClusterView } from "@/lib/api-types"

interface ClusterDisplayStateInput {
  cluster: ClusterView | undefined
  isLoading: boolean
  isError: boolean
}

export interface ClusterDisplayState {
  summary: {
    mode: string
    quorum: string
    leader: string
    localNode: string
  }
  membersMessage?: string
  localMessage?: string
  canJoin: boolean
  joinDisabledReason?: string
}

export function getClusterDisplayState({
  cluster,
  isLoading,
  isError,
}: ClusterDisplayStateInput): ClusterDisplayState {
  if (isLoading) {
    return {
      summary: {
        mode: "Loading...",
        quorum: "Loading...",
        leader: "Loading...",
        localNode: "Loading...",
      },
      membersMessage: "Loading cluster members...",
      localMessage: "Loading local node...",
      canJoin: false,
      joinDisabledReason: "Cluster state is still loading.",
    }
  }

  if (isError || !cluster) {
    return {
      summary: {
        mode: "Unavailable",
        quorum: "Unavailable",
        leader: "Unavailable",
        localNode: "Unavailable",
      },
      membersMessage: "Cluster state unavailable.",
      localMessage: "Cluster state unavailable.",
      canJoin: false,
      joinDisabledReason: "Cluster state is unavailable.",
    }
  }

  if (!cluster.enabled) {
    return {
      summary: {
        mode: "file",
        quorum: cluster.quorum_status ?? "disabled",
        leader: cluster.leader.id ?? "none",
        localNode: cluster.local.id ?? "unknown",
      },
      membersMessage: "Raft is disabled in file mode.",
      canJoin: false,
      joinDisabledReason: "Raft is disabled in file mode.",
    }
  }

  return {
    summary: {
      mode: "raft",
      quorum: cluster.quorum_status ?? "unknown",
      leader: cluster.leader.id ?? "unknown",
      localNode: cluster.local.id ?? "unknown",
    },
    canJoin: true,
  }
}
