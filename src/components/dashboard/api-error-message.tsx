import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { DashboardApiError } from "@/lib/api-client";

interface ApiErrorMessageProps {
  error: unknown;
  fallback?: string;
}

export function ApiErrorMessage({ error, fallback = "The operation failed." }: ApiErrorMessageProps) {
  if (!error) {
    return null;
  }

  if (!(error instanceof DashboardApiError)) {
    return <p className="text-sm text-destructive">{error instanceof Error ? error.message : fallback}</p>;
  }

  return (
    <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <p className="font-medium text-destructive">{error.message}</p>
      {error.isNotLeader && error.leaderAddress ? (
        <p className="text-muted-foreground">Raft leader: {error.leaderAddress}. Send this change from the leader node.</p>
      ) : null}
      {error.validationErrors?.length ? (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {error.validationErrors.map((validationError) => (
            <li key={`${validationError.field}:${validationError.message}`}>
              {validationError.field}: {validationError.message}
            </li>
          ))}
        </ul>
      ) : null}
      {error.requiresSetup ? (
        <Button asChild variant="outline" size="sm">
          <Link to="/setup">Open setup</Link>
        </Button>
      ) : null}
    </div>
  );
}
