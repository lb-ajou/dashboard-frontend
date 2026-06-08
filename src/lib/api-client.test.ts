import { afterEach, describe, expect, test } from "bun:test";
import { DashboardApiError, apiGet, apiPostNoContent, configPathForTesting } from "./api-client";

const originalFetch = globalThis.fetch;

function mockFetch(response: Response) {
  globalThis.fetch = Object.assign(async () => response, {
    preconnect: originalFetch.preconnect,
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("api-client", () => {
  test("preserves structured API error fields", async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          message: "configuration writes must be sent to the raft leader",
          code: "not_raft_leader",
          leader_address: "10.0.0.11:7001",
          errors: [{ field: "routes[0].id", message: "duplicate route id" }],
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(apiGet("/status", "Failed to fetch status")).rejects.toMatchObject({
      status: 409,
      code: "not_raft_leader",
      leaderAddress: "10.0.0.11:7001",
      validationErrors: [{ field: "routes[0].id", message: "duplicate route id" }],
    });
  });

  test("returns undefined for successful 204 responses", async () => {
    mockFetch(new Response(null, { status: 204 }));

    const result = await apiPostNoContent("/cluster/bootstrap", { node_id: "node-1" }, "Bootstrap failed");

    expect(result).toBeUndefined();
  });

  test("keeps default config compatibility path inside the API layer", () => {
    expect(configPathForTesting()).toBe("/namespaces/default/config");
  });

  test("DashboardApiError exposes a readable message", () => {
    const error = new DashboardApiError(500, { message: "server exploded" }, "Fallback");

    expect(error.message).toBe("server exploded");
    expect(error.status).toBe(500);
  });
});
