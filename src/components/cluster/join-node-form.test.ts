import { describe, expect, test } from "bun:test"
import { canSubmitJoinNode } from "@/components/cluster/join-node-form"

describe("join node form submission guard", () => {
  test("allows submission only when enabled, idle, and both trimmed fields are present", () => {
    expect(canSubmitJoinNode({ disabled: false, isPending: false, nodeId: " node-2 ", raftAddress: " 127.0.0.1:7002 " })).toBe(
      true,
    )

    expect(canSubmitJoinNode({ disabled: true, isPending: false, nodeId: "node-2", raftAddress: "127.0.0.1:7002" })).toBe(
      false,
    )
    expect(canSubmitJoinNode({ disabled: false, isPending: true, nodeId: "node-2", raftAddress: "127.0.0.1:7002" })).toBe(
      false,
    )
    expect(canSubmitJoinNode({ disabled: false, isPending: false, nodeId: " ", raftAddress: "127.0.0.1:7002" })).toBe(
      false,
    )
    expect(canSubmitJoinNode({ disabled: false, isPending: false, nodeId: "node-2", raftAddress: " " })).toBe(false)
  })
})
