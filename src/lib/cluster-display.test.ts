import { describe, expect, test } from "bun:test"
import type { ClusterView } from "@/lib/api-types"
import { getDashboardClusterDisplayState } from "@/lib/cluster-display"

function raftCluster(): ClusterView {
  return {
    enabled: true,
    quorum_status: "available",
    leader: { id: "node-1", address: "127.0.0.1:7001" },
    local: {
      id: "node-1",
      address: "127.0.0.1:7001",
      state: "leader",
      term: "3",
      last_log_index: "42",
      commit_index: "42",
      applied_index: "42",
    },
    members: [
      {
        id: "node-1",
        address: "127.0.0.1:7001",
        role: "voter",
        is_leader: true,
      },
    ],
  }
}

describe("cluster display state", () => {
  test("prepares a compact loading state for the dashboard", () => {
    const state = getDashboardClusterDisplayState({ cluster: undefined, isLoading: true, isError: false })

    expect(state.status).toEqual({
      label: "Loading...",
      tone: "muted",
    })
    expect(state.quorum).toBe("Loading...")
    expect(state.leader).toBe("Loading...")
    expect(state.localNode).toBe("Loading...")
    expect(state.memberCountLabel).toBe("Loading...")
    expect(state.members).toEqual([])
    expect(state.message).toBe("Loading cluster members...")
  })

  test("prepares a compact unavailable state for the dashboard", () => {
    const state = getDashboardClusterDisplayState({ cluster: undefined, isLoading: false, isError: true })

    expect(state.status).toEqual({
      label: "Unavailable",
      tone: "destructive",
    })
    expect(state.quorum).toBe("Unavailable")
    expect(state.leader).toBe("Unavailable")
    expect(state.localNode).toBe("Unavailable")
    expect(state.memberCountLabel).toBe("Unavailable")
    expect(state.members).toEqual([])
    expect(state.message).toBe("Cluster state unavailable.")
  })

  test("shows disabled file mode without implying a loading or error state", () => {
    const state = getDashboardClusterDisplayState({
      cluster: { ...raftCluster(), enabled: false, quorum_status: "disabled", leader: {}, members: [] },
      isLoading: false,
      isError: false,
    })

    expect(state.status).toEqual({
      label: "File mode",
      tone: "secondary",
    })
    expect(state.quorum).toBe("disabled")
    expect(state.leader).toBe("none")
    expect(state.localNode).toBe("node-1")
    expect(state.memberCountLabel).toBe("0 members")
    expect(state.members).toEqual([])
    expect(state.message).toBe("Raft is disabled in file mode.")
  })

  test("shows only operational raft details for the dashboard", () => {
    const state = getDashboardClusterDisplayState({ cluster: raftCluster(), isLoading: false, isError: false })

    expect(state.status).toEqual({
      label: "Raft",
      tone: "default",
    })
    expect(state.quorum).toBe("available")
    expect(state.leader).toBe("node-1")
    expect(state.localNode).toBe("node-1")
    expect(state.memberCountLabel).toBe("1 member")
    expect(state.members).toEqual([
      {
        id: "node-1",
        address: "127.0.0.1:7001",
        role: "voter",
        isLeader: true,
      },
    ])
    expect(state.message).toBeUndefined()
  })
})
