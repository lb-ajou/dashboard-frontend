import { Navigate } from "react-router";

import { useNodeClusterStatus } from "@/hooks/use-config";

export function AppEntryPage() {
  const { data, isLoading, error } = useNodeClusterStatus();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Checking node status...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold">Unable to load node status</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </main>
    );
  }

  if (data?.state !== "clustered") {
    return <Navigate to="/setup" replace />;
  }

  return <Navigate to="/overview" replace />;
}
