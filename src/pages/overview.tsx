import { Link } from "react-router";
import { ArrowRight, AlertTriangle } from "lucide-react";

import { ClusterMembersCard } from "@/components/dashboard/cluster-members-card";
import { ProjectionStatusBanner } from "@/components/dashboard/projection-status-banner";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCluster, useStatus } from "@/hooks/use-config";
import { getWriteAvailability } from "@/lib/write-availability";

export function OverviewPage() {
  const { data: status, isLoading: statusLoading, error: statusError } = useStatus();
  const { data: cluster, isLoading: clusterLoading, error: clusterError } = useCluster();
  const writeAvailability = getWriteAvailability(status);

  const alerts = [
    status?.raft.enabled && !status.raft.has_leader
      ? {
          title: "No raft leader",
          description: "Cluster writes are unavailable until a leader is elected.",
          href: "/node",
        }
      : undefined,
    status?.runtime.unhealthy_target_count
      ? {
          title: "Unhealthy targets",
          description: `${status.runtime.unhealthy_target_count} runtime targets are unhealthy.`,
          href: "/upstreams",
        }
      : undefined,
    !writeAvailability.canWrite
      ? {
          title: "Read-only mode",
          description: writeAvailability.reason ?? "Configuration writes are unavailable.",
          href: writeAvailability.setupRequired ? "/setup" : "/node",
        }
      : undefined,
  ].filter((alert): alert is { title: string; description: string; href: string } => Boolean(alert));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Monitor routes, upstream targets, cluster membership, and write availability.</p>
      </div>

      {statusError ? <p className="text-sm text-destructive">{statusError.message}</p> : null}

      <ProjectionStatusBanner status={status} hideWhenApplied />

      {alerts.length ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alerts
            </CardTitle>
            <CardDescription>Operational conditions that need attention.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {alerts.map((alert) => (
              <div key={`${alert.title}-${alert.href}`} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={alert.href}>
                    Inspect
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <StatsCards status={status} isLoading={statusLoading} />

      <ClusterMembersCard cluster={cluster} isLoading={clusterLoading} error={clusterError} />
    </div>
  );
}
