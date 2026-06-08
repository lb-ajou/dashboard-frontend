import type { NamespaceConfigView, ReplaceConfigRequest } from "@/lib/api-types";
import { toReplaceConfigRequest } from "@/lib/config-mutations";

const metadataKeys = ["namespace", "exists", "applied_at"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildConfigExport(config: NamespaceConfigView): ReplaceConfigRequest {
  return toReplaceConfigRequest(config);
}

export function parseConfigImport(text: string): ReplaceConfigRequest {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Import file must contain valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Import file must contain routes and upstream_pools.");
  }

  if (metadataKeys.some((key) => key in parsed)) {
    throw new Error("Import file must contain only routes and upstream_pools.");
  }

  if (!Array.isArray(parsed.routes)) {
    throw new Error("Import file routes must be an array.");
  }

  if (!isRecord(parsed.upstream_pools)) {
    throw new Error("Import file upstream_pools must be an object.");
  }

  return {
    routes: parsed.routes as ReplaceConfigRequest["routes"],
    upstream_pools: parsed.upstream_pools as ReplaceConfigRequest["upstream_pools"],
  };
}

export function configExportFilename(date = new Date()) {
  return `ajoulb-config-${date.toISOString().slice(0, 10)}.json`;
}

export function configImportConfirmationMessage(request: ReplaceConfigRequest) {
  const routeCount = request.routes.length;
  const upstreamCount = Object.keys(request.upstream_pools).length;

  return `Importing this file will replace all routes and upstream pools.\n\nRoutes: ${routeCount}\nUpstream pools: ${upstreamCount}\n\nContinue?`;
}
