import { describe, expect, test } from "bun:test";
import type { NamespaceConfigView } from "./api-types";
import {
  buildConfigExport,
  configExportFilename,
  configImportConfirmationMessage,
  parseConfigImport,
} from "./config-transfer";

function config(): NamespaceConfigView {
  return {
    namespace: "default",
    exists: true,
    applied_at: "2026-06-08T00:00:00Z",
    routes: [
      {
        id: "dashboard",
        enabled: true,
        match: { hosts: ["localhost"] },
        algorithm: "round_robin",
        upstream_pool: "dashboard",
      },
    ],
    upstream_pools: {
      dashboard: {
        upstreams: ["localhost:3000"],
      },
    },
  };
}

describe("config transfer", () => {
  test("exports only the replace-config payload", () => {
    expect(buildConfigExport(config())).toEqual({
      routes: config().routes,
      upstream_pools: config().upstream_pools,
    });
  });

  test("parses a valid replace-config import payload", () => {
    const payload = {
      routes: [],
      upstream_pools: {
        dashboard: { upstreams: ["localhost:3000"] },
      },
    };

    expect(parseConfigImport(JSON.stringify(payload))).toEqual(payload);
  });

  test("rejects raw config view metadata during import", () => {
    expect(() => parseConfigImport(JSON.stringify(buildConfigExport(config())))).not.toThrow();

    expect(() =>
      parseConfigImport(
        JSON.stringify({
          exists: true,
          applied_at: "2026-06-08T00:00:00Z",
          routes: [],
          upstream_pools: {},
        }),
      ),
    ).toThrow("routes and upstream_pools");
  });

  test("rejects invalid json and invalid payload shapes", () => {
    expect(() => parseConfigImport("{")).toThrow("valid JSON");
    expect(() => parseConfigImport(JSON.stringify({ routes: {}, upstream_pools: {} }))).toThrow("routes");
    expect(() => parseConfigImport(JSON.stringify({ routes: [], upstream_pools: [] }))).toThrow("upstream_pools");
  });

  test("builds a stable dated export filename", () => {
    expect(configExportFilename(new Date("2026-06-08T12:34:56Z"))).toBe("ajoulb-config-2026-06-08.json");
  });

  test("builds an import confirmation message with replacement counts", () => {
    expect(configImportConfirmationMessage(buildConfigExport(config()))).toBe(
      "Importing this file will replace all routes and upstream pools.\n\nRoutes: 1\nUpstream pools: 1\n\nContinue?",
    );
  });
});
