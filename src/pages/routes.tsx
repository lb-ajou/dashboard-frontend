import * as React from "react";
import { Plus } from "lucide-react";

import { useConfig, useSaveConfig } from "@/hooks/use-config";
import { useCurrentNamespace } from "@/hooks/use-namespace";
import { addRouteToConfig, deleteRouteFromConfig, toPutRequest, upsertRouteInConfig } from "@/lib/config-mutations";
import { formatApiError } from "@/lib/api-client";
import type { Route } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RoutesTable } from "@/components/routes/routes-table";
import { RouteDialog } from "@/components/routes/route-dialog";

export function RoutesPage() {
  const namespace = useCurrentNamespace();
  const { data: config, isLoading, isError, error } = useConfig(namespace);
  const saveConfig = useSaveConfig(namespace);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draftRoute, setDraftRoute] = React.useState<Route | null>(null);
  const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null);

  const routes = config?.routes ?? [];
  const upstreamPoolIds = Object.keys(config?.upstream_pools ?? {});
  const isSaving = saveConfig.isPending;
  const canCreate = !!config && !isSaving;

  function saveNextConfig(nextConfig: typeof config, onSuccess: () => void) {
    if (isSaving) {
      window.alert("A route save is already in progress.");
      return;
    }

    if (!nextConfig) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    saveConfig.mutate(toPutRequest(nextConfig), {
      onSuccess,
      onError: (error) => {
        window.alert(formatApiError(error));
      },
    });
  }

  const handleCreate = () => {
    if (!canCreate) {
      return;
    }

    setDraftRoute(null);
    setEditingRouteId(null);
    setDialogOpen(true);
  };

  const handleEdit = (route: Route) => {
    if (isSaving) {
      return;
    }

    setDraftRoute(route);
    setEditingRouteId(route.id);
    setDialogOpen(true);
  };

  const handleDuplicate = (route: Route) => {
    if (isSaving) {
      return;
    }

    const duplicated: Route = {
      ...route,
      id: `${route.id}-copy`,
      match: {
        ...route.match,
        hosts: [...route.match.hosts],
        path: route.match.path ? { ...route.match.path } : undefined,
      },
    };
    setDraftRoute(duplicated);
    setEditingRouteId(null);
    setDialogOpen(true);
  };

  const handleDelete = (route: Route) => {
    if (isSaving) {
      window.alert("A route save is already in progress.");
      return;
    }

    if (!config) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    if (confirm(`Are you sure you want to delete route "${route.id}"?`)) {
      saveNextConfig(deleteRouteFromConfig(config, route.id), () => {
        setDraftRoute(null);
        setEditingRouteId(null);
      });
    }
  };

  const handleSubmit = (routeData: Route) => {
    if (isSaving) {
      window.alert("A route save is already in progress.");
      return;
    }

    if (!config) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    try {
      const nextConfig = editingRouteId
        ? upsertRouteInConfig(config, editingRouteId, routeData)
        : addRouteToConfig(config, routeData);

      saveNextConfig(nextConfig, () => {
        setDialogOpen(false);
        setDraftRoute(null);
        setEditingRouteId(null);
      });
    } catch (error) {
      window.alert(formatApiError(error));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
            <p className="text-muted-foreground">Loading {namespace} routes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
            <p className="text-muted-foreground">Unable to load {namespace} routes.</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Route
          </Button>
        </div>
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {formatApiError(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground">Manage request routing rules for the {namespace} namespace</p>
        </div>
        <Button onClick={handleCreate} disabled={!canCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Route
        </Button>
      </div>

      <RoutesTable
        routes={routes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        disabled={isSaving}
      />

      <RouteDialog
        route={draftRoute}
        isEditing={!!editingRouteId}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setDraftRoute(null);
            setEditingRouteId(null);
          }
        }}
        upstreamPoolIds={upstreamPoolIds}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
      />
    </div>
  );
}
