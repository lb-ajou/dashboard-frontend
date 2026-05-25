import type { ClusterView } from "@/lib/api-types"

export type DashboardClusterTone = "default" | "secondary" | "destructive" | "muted"

export interface DashboardClusterMember {
  id: string
  address: string
  role: string
  isLeader: boolean
}

export interface DashboardClusterDisplayState {
  status: {
    label: string
    tone: DashboardClusterTone
  }
  quorum: string
  leader: string
  localNode: string
  memberCountLabel: string
  members: DashboardClusterMember[]
  message?: string
}

interface DashboardClusterDisplayStateInput {
  cluster: ClusterView | undefined
  isLoading: boolean
  isError: boolean
}

export function getDashboardClusterDisplayState({
  cluster,
  isLoading,
  isError,
}: DashboardClusterDisplayStateInput): DashboardClusterDisplayState {
  if (isLoading) {
    return {
      status: {
        label: "Loading...",
        tone: "muted",
      },
      quorum: "Loading...",
      leader: "Loading...",
      localNode: "Loading...",
      memberCountLabel: "Loading...",
      members: [],
      message: "Loading cluster members...",
    }
  }

  if (isError || !cluster) {
    return {
      status: {
        label: "Unavailable",
        tone: "destructive",
      },
      quorum: "Unavailable",
      leader: "Unavailable",
      localNode: "Unavailable",
      memberCountLabel: "Unavailable",
      members: [],
      message: "Cluster state unavailable.",
    }
  }

  const members = cluster.members.map((member) => ({
    id: member.id,
    address: member.address,
    role: member.role,
    isLeader: member.is_leader,
  }))
  const memberCountLabel = `${members.length} ${members.length === 1 ? "member" : "members"}`

  if (!cluster.enabled) {
    return {
      status: {
        label: "File mode",
        tone: "secondary",
      },
      quorum: cluster.quorum_status ?? "disabled",
      leader: cluster.leader.id ?? "none",
      localNode: cluster.local.id ?? "unknown",
      memberCountLabel,
      members,
      message: "Raft is disabled in file mode.",
    }
  }

  return {
    status: {
      label: "Raft",
      tone: "default",
    },
    quorum: cluster.quorum_status ?? "unknown",
    leader: cluster.leader.id ?? "unknown",
    localNode: cluster.local.id ?? "unknown",
    memberCountLabel,
    members,
  }
}
