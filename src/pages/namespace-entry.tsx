import { Navigate, useNavigate } from "react-router";

import { useCreateNamespace, useNamespaces } from "@/hooks/use-config";
import { namespacePath } from "@/hooks/use-namespace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { INVALID_NAMESPACE_MESSAGE, isValidNamespaceName } from "@/lib/namespaces";

interface NamespaceEntryPageProps {
  subpath?: string;
}

export function NamespaceEntryPage({ subpath }: NamespaceEntryPageProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useNamespaces();
  const createNamespace = useCreateNamespace();

  const firstNamespace = data?.items[0]?.namespace;

  if (firstNamespace) {
    return <Navigate to={namespacePath(firstNamespace, subpath)} replace />;
  }

  const handleCreateNamespace = () => {
    const nextNamespace = window.prompt("Enter a namespace name");
    const trimmedNamespace = nextNamespace?.trim();

    if (!trimmedNamespace) {
      return;
    }

    if (!isValidNamespaceName(trimmedNamespace)) {
      window.alert(INVALID_NAMESPACE_MESSAGE);
      return;
    }

    createNamespace.mutate(trimmedNamespace, {
      onSuccess: (createdNamespace) => {
        navigate(namespacePath(createdNamespace.namespace, subpath), { replace: true });
      },
      onError: (createError) => {
        window.alert(createError.message);
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Select a Namespace</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading available namespaces..."
              : "No namespace is available yet. Create one to start editing proxy configuration."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
          {!isLoading ? (
            <Button onClick={handleCreateNamespace} disabled={createNamespace.isPending}>
              {createNamespace.isPending ? "Creating..." : "Create Namespace"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
