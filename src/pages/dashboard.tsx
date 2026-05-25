import { Link } from "react-router";
import { GitBranch, Plus, Route, Server } from "lucide-react";

import { useConfig, useRuntime, useStatus } from "@/hooks/use-config";
import { namespacePath, useCurrentNamespace } from "@/hooks/use-namespace";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ConfigViewer } from "@/components/dashboard/config-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardPage() {
  const namespace = useCurrentNamespace();
  const { data: config, isLoading: isConfigLoading } = useConfig(namespace);
  const { data: status, isLoading: isStatusLoading } = useStatus();
  const { data: runtime } = useRuntime();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of the {namespace} namespace configuration</p>
        </div>
      </div>

      <StatsCards status={status} isLoading={isStatusLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <ConfigViewer config={config} isLoading={isConfigLoading} namespace={namespace} />

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common operations for managing your proxy</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="justify-start">
                  <Link to={namespacePath(namespace, "routes")}>
                    <Plus className="mr-2 h-4 w-4" />
                    <Route className="mr-2 h-4 w-4" />
                    Create New Route
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link to={namespacePath(namespace, "upstreams")}>
                    <Plus className="mr-2 h-4 w-4" />
                    <Server className="mr-2 h-4 w-4" />
                    Create Upstream Pool
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link to={namespacePath(namespace, "cluster")}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Cluster Status
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Runtime Sources</CardTitle>
              <CardDescription>Applied snapshot from this node</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {runtime?.config_sources.length ? (
                runtime.config_sources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{source.name || source.source}</div>
                      <div className="truncate text-xs text-muted-foreground">{source.path || source.source}</div>
                    </div>
                    <Badge variant="outline">
                      {source.route_count}/{source.upstream_pool_count}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No runtime source loaded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
