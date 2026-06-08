import * as React from "react";
import { Plus } from "lucide-react";

import { ApiErrorMessage } from "@/components/dashboard/api-error-message";
import { ProjectionStatusBanner } from "@/components/dashboard/projection-status-banner";
import { RouteDialog } from "@/components/routes/route-dialog";
import { RoutesTable } from "@/components/routes/routes-table";
import { Button } from "@/components/ui/button";
import { useConfig, useSaveConfig, useStatus } from "@/hooks/use-config";
import { addRoute, deleteRoute, replaceRoute, toReplaceConfigRequest } from "@/lib/config-mutations";
import type { Route } from "@/lib/types";
import { getWriteAvailability } from "@/lib/write-availability";

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to save configuration.";
}

export function RoutesPage() {
  const { data: config, isLoading, error } = useConfig();
  const { data: status } = useStatus();
  const saveConfig = useSaveConfig();
  const writeAvailability = getWriteAvailability(status);
  const canWrite = writeAvailability.canWrite;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<Route | null>(null);

  const routes = config?.routes ?? [];
  const upstreamPoolIds = Object.keys(config?.upstream_pools ?? {});
  const isSaving = saveConfig.isPending;

  const saveNextConfig = (nextRouteConfig: NonNullable<typeof config>, onSuccess?: () => void) => {
    saveConfig.mutate(toReplaceConfigRequest(nextRouteConfig), { onSuccess });
  };

  const handleCreate = () => {
    if (!canWrite || isLoading || isSaving) return;
    setEditingRoute(null);
    setDialogOpen(true);
  };

  const handleEdit = (route: Route) => {
    if (!canWrite || isSaving) return;
    setEditingRoute(route);
    setDialogOpen(true);
  };

  const handleDuplicate = (route: Route) => {
    if (!config || !canWrite || isSaving) return;

    try {
      const duplicated: Route = {
        ...route,
        id: `${route.id}-copy`,
        match: {
          ...route.match,
          hosts: [...route.match.hosts],
          path: route.match.path ? { ...route.match.path } : undefined,
        },
      };
      const nextConfig = addRoute(config, duplicated);
      saveNextConfig(nextConfig);
    } catch (err) {
      alert(mutationErrorMessage(err));
    }
  };

  const handleDelete = (route: Route) => {
    if (!config || !canWrite || isSaving) return;

    if (confirm(`Are you sure you want to delete route "${route.id}"?`)) {
      const nextConfig = deleteRoute(config, route.id);
      saveNextConfig(nextConfig);
    }
  };

  const handleSubmit = (routeData: Route) => {
    if (!config || !canWrite || isSaving) return;

    try {
      const nextConfig = editingRoute ? replaceRoute(config, editingRoute.id, routeData) : addRoute(config, routeData);

      saveNextConfig(nextConfig, () => {
        setDialogOpen(false);
        setEditingRoute(null);
      });
    } catch (err) {
      alert(mutationErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground">Manage desired request routing rules.</p>
          {!canWrite ? <p className="mt-2 text-sm text-muted-foreground">{writeAvailability.reason}</p> : null}
        </div>
        <Button onClick={handleCreate} disabled={!canWrite || isLoading || isSaving}>
          <Plus className="size-4" />
          Create Route
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      <ApiErrorMessage error={saveConfig.error} fallback="Failed to save route configuration." />
      <ProjectionStatusBanner status={status} compact hideWhenApplied />

      <RoutesTable
        routes={routes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        canWrite={canWrite && !isSaving}
      />

      <RouteDialog
        route={editingRoute}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRoute(null);
        }}
        upstreamPoolIds={upstreamPoolIds}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
      />
    </div>
  );
}
