import { describe, expect, test } from "bun:test";

import { DashboardApiError } from "@/lib/api-client";
import { saveConfigErrorInvalidationKeys, queryKeys, setupErrorInvalidationKeys } from "./use-config";

describe("saveConfigErrorInvalidationKeys", () => {
  test("refreshes status and cluster views for not-leader save failures", () => {
    const error = new DashboardApiError(
      409,
      { message: "not leader", code: "not_raft_leader", leader_address: "10.0.0.11:7001" },
      "Failed to save configuration",
    );

    expect(saveConfigErrorInvalidationKeys(error)).toEqual([queryKeys.status, queryKeys.cluster]);
  });

  test("refreshes setup and status views for unconfigured-cluster save failures", () => {
    const error = new DashboardApiError(
      409,
      { message: "cluster not configured", code: "cluster_not_configured" },
      "Failed to save configuration",
    );

    expect(saveConfigErrorInvalidationKeys(error)).toEqual([queryKeys.nodeClusterStatus, queryKeys.status]);
  });

  test("does not request extra refreshes for generic save failures", () => {
    expect(saveConfigErrorInvalidationKeys(new Error("boom"))).toEqual([]);
  });
});

describe("setupErrorInvalidationKeys", () => {
  test("refreshes node setup state when cluster is already configured", () => {
    const error = new DashboardApiError(
      409,
      { message: "cluster already configured", code: "cluster_already_configured" },
      "Bootstrap failed",
    );

    expect(setupErrorInvalidationKeys(error)).toEqual([queryKeys.nodeClusterStatus, queryKeys.status, queryKeys.cluster]);
  });

  test("does not request setup refreshes for generic failures", () => {
    expect(setupErrorInvalidationKeys(new Error("boom"))).toEqual([]);
  });
});
