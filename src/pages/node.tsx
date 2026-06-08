import { useCluster, useStatus } from "@/hooks/use-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function displayValue(value?: string | boolean) {
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  return value || "unknown";
}

function displayVipAddress(status: ReturnType<typeof useStatus>["data"]) {
  if (!status) {
    return "unknown";
  }

  if (!status.vip.enabled) {
    return "disabled";
  }

  return displayValue(status.vip.address);
}

function timingValue(value?: string) {
  return value || "-";
}

export function NodePage() {
  const { data: cluster, isLoading, error } = useCluster();
  const { data: status } = useStatus();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading node state...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Node</h1>
        <p className="text-muted-foreground">Inspect local node state, raft timing, VIP ownership, and log positions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Node Identity</CardTitle>
            <CardDescription>{displayValue(cluster?.local.id ?? status?.node.id)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm text-muted-foreground">
            <p>Address: {displayValue(cluster?.local.address)}</p>
            <p>State: {displayValue(cluster?.local.state ?? status?.raft.state)}</p>
            <p>Term: {displayValue(cluster?.local.term)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>VIP Ownership</CardTitle>
            <CardDescription>{displayVipAddress(status)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm text-muted-foreground">
            <p>Owned: {displayValue(status?.vip.owned)}</p>
            {status?.vip.interface ? <p>Interface: {status.vip.interface}</p> : null}
            {status?.vip.last_error ? <p className="text-destructive">{status.vip.last_error}</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Raft Log</CardTitle>
            <CardDescription>Local raft index positions reported by this node.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <p>Last log index: {displayValue(cluster?.local.last_log_index)}</p>
            <p>Commit index: {displayValue(cluster?.local.commit_index)}</p>
            <p>Applied index: {displayValue(cluster?.local.applied_index)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raft Timing</CardTitle>
            <CardDescription>Configured timing values reported by this node.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Heartbeat: {timingValue(cluster?.raft_timing?.heartbeat_timeout)}</p>
            <p>Election: {timingValue(cluster?.raft_timing?.election_timeout)}</p>
            <p>Leader lease: {timingValue(cluster?.raft_timing?.leader_lease_timeout)}</p>
            <p>Commit: {timingValue(cluster?.raft_timing?.commit_timeout)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
