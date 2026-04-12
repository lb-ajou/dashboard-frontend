import { useParams } from "react-router";

const NAMESPACE_ROUTE_PREFIX = "/namespaces";

export function namespacePath(namespace: string, subpath?: string) {
  const basePath = `${NAMESPACE_ROUTE_PREFIX}/${encodeURIComponent(namespace)}`;
  if (!subpath) {
    return basePath;
  }

  const normalizedSubpath = subpath.replace(/^\/+/, "");
  return `${basePath}/${normalizedSubpath}`;
}

export function useCurrentNamespace() {
  const { namespace } = useParams();

  if (!namespace) {
    throw new Error("Namespace route parameter is required");
  }

  return namespace;
}
