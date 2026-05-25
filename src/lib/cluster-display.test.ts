import { describe, expect, test } from "bun:test"
import type { ClusterView } from "@/lib/api-types"
import { getClusterDisplayState } from "@/lib/cluster-display"

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
  test("distinguishes loading from reported cluster state", () => {
    const state = getClusterDisplayState({ cluster: undefined, isLoading: true, isError: false })

    expect(state.summary).toEqual({
      mode: "Loading...",
      quorum: "Loading...",
      leader: "Loading...",
      localNode: "Loading...",
    })
    expect(state.membersMessage).toBe("Loading cluster members...")
    expect(state.localMessage).toBe("Loading local node...")
    expect(state.canJoin).toBe(false)
  })

  test("distinguishes errors from disabled file mode", () => {
    const state = getClusterDisplayState({ cluster: undefined, isLoading: false, isError: true })

    expect(state.summary).toEqual({
      mode: "Unavailable",
      quorum: "Unavailable",
      leader: "Unavailable",
      localNode: "Unavailable",
    })
    expect(state.membersMessage).toBe("Cluster state unavailable.")
    expect(state.localMessage).toBe("Cluster state unavailable.")
    expect(state.canJoin).toBe(false)
  })

  test("shows disabled file mode without implying a loading or error state", () => {
    const state = getClusterDisplayState({
      cluster: { ...raftCluster(), enabled: false, quorum_status: "disabled", members: [] },
      isLoading: false,
      isError: false,
    })

    expect(state.summary.mode).toBe("file")
    expect(state.summary.quorum).toBe("disabled")
    expect(state.membersMessage).toBe("Raft is disabled in file mode.")
    expect(state.canJoin).toBe(false)
    expect(state.joinDisabledReason).toBe("Raft is disabled in file mode.")
  })

  test("allows joining only when raft cluster state is available", () => {
    const state = getClusterDisplayState({ cluster: raftCluster(), isLoading: false, isError: false })

    expect(state.summary).toEqual({
      mode: "raft",
      quorum: "available",
      leader: "node-1",
      localNode: "node-1",
    })
    expect(state.membersMessage).toBeUndefined()
    expect(state.localMessage).toBeUndefined()
    expect(state.canJoin).toBe(true)
  })
})
