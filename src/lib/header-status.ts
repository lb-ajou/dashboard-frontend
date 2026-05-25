import type { StatusView } from "@/lib/api-types"

export type HeaderStatusTone = "default" | "secondary" | "destructive" | "outline"

interface HeaderStatusDisplayInput {
  status: StatusView | undefined
  isLoading: boolean
  isError: boolean
}

export interface HeaderStatusDisplay {
  nodeLabel: string
  roleLabel: string
  quorumLabel: string
  roleTone: HeaderStatusTone
  quorumTone: HeaderStatusTone
}

function titleCase(value: string) {
  if (!value) {
    return "Unknown"
  }

  return value.slice(0, 1).toUpperCase() + value.slice(1).replaceAll("_", " ")
}

function quorumTone(status: string): HeaderStatusTone {
  if (status === "unavailable") {
    return "destructive"
  }

  if (status === "available") {
    return "secondary"
  }

  return "outline"
}

export function getHeaderStatusDisplay({
  status,
  isLoading,
  isError,
}: HeaderStatusDisplayInput): HeaderStatusDisplay {
  if (isLoading) {
    return {
      nodeLabel: "Loading node",
      roleLabel: "Checking",
      quorumLabel: "Quorum ...",
      roleTone: "outline",
      quorumTone: "outline",
    }
  }

  if (isError || !status) {
    return {
      nodeLabel: "Node unavailable",
      roleLabel: "Unknown",
      quorumLabel: "Quorum unknown",
      roleTone: "destructive",
      quorumTone: "destructive",
    }
  }

  const raft = status.raft
  const quorum = raft.quorum_status ?? "unknown"

  if (!raft.enabled) {
    return {
      nodeLabel: status.node.id ?? "unknown node",
      roleLabel: "File mode",
      quorumLabel: `Quorum ${quorum}`,
      roleTone: "secondary",
      quorumTone: quorumTone(quorum),
    }
  }

  return {
    nodeLabel: status.node.id ?? "unknown node",
    roleLabel: titleCase(raft.state),
    quorumLabel: `Quorum ${quorum}`,
    roleTone: raft.is_leader ? "default" : "outline",
    quorumTone: quorumTone(quorum),
  }
}
