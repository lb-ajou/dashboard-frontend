import { describe, expect, test } from "bun:test"
import type { StatusView } from "@/lib/api-types"
import { getHeaderStatusDisplay } from "@/lib/header-status"

function status(overrides: Partial<StatusView> = {}): StatusView {
  return {
    node: {
      id: "node-1",
      config_store: "raft",
      proxy_listen_addr: ":8080",
      dashboard_listen_addr: ":9090",
      applied_at: "2026-05-26T00:00:00Z",
      projection: { status: "ok" },
    },
    raft: {
      enabled: true,
      state: "leader",
      is_leader: true,
      leader_id: "node-1",
      has_leader: true,
      quorum_status: "available",
    },
    vip: {
      enabled: false,
      owned: false,
    },
    runtime: {
      route_count: 1,
      upstream_pool_count: 1,
      target_count: 3,
      healthy_target_count: 3,
      unhealthy_target_count: 0,
    },
    ...overrides,
  }
}

describe("header status display", () => {
  test("shows a compact loading state", () => {
    const display = getHeaderStatusDisplay({ status: undefined, isLoading: true, isError: false })

    expect(display.nodeLabel).toBe("Loading node")
    expect(display.roleLabel).toBe("Checking")
    expect(display.quorumLabel).toBe("Quorum ...")
    expect(display.roleTone).toBe("outline")
    expect(display.quorumTone).toBe("outline")
  })

  test("shows unavailable when status cannot be loaded", () => {
    const display = getHeaderStatusDisplay({ status: undefined, isLoading: false, isError: true })

    expect(display.nodeLabel).toBe("Node unavailable")
    expect(display.roleLabel).toBe("Unknown")
    expect(display.quorumLabel).toBe("Quorum unknown")
    expect(display.roleTone).toBe("destructive")
    expect(display.quorumTone).toBe("destructive")
  })

  test("shows leader node status", () => {
    const display = getHeaderStatusDisplay({ status: status(), isLoading: false, isError: false })

    expect(display.nodeLabel).toBe("node-1")
    expect(display.roleLabel).toBe("Leader")
    expect(display.quorumLabel).toBe("Quorum available")
    expect(display.roleTone).toBe("default")
    expect(display.quorumTone).toBe("secondary")
  })

  test("shows follower node status without overloading the header", () => {
    const display = getHeaderStatusDisplay({
      status: status({
        node: { ...status().node, id: "node-2" },
        raft: {
          ...status().raft,
          state: "follower",
          is_leader: false,
          leader_id: "node-1",
        },
      }),
      isLoading: false,
      isError: false,
    })

    expect(display.nodeLabel).toBe("node-2")
    expect(display.roleLabel).toBe("Follower")
    expect(display.quorumLabel).toBe("Quorum available")
    expect(display.roleTone).toBe("outline")
  })

  test("shows disabled raft state", () => {
    const display = getHeaderStatusDisplay({
      status: status({
        raft: {
          ...status().raft,
          enabled: false,
          state: "disabled",
          is_leader: false,
          has_leader: false,
          quorum_status: "disabled",
        },
      }),
      isLoading: false,
      isError: false,
    })

    expect(display.roleLabel).toBe("File mode")
    expect(display.quorumLabel).toBe("Quorum disabled")
    expect(display.roleTone).toBe("secondary")
    expect(display.quorumTone).toBe("outline")
  })
})
