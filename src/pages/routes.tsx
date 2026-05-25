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
  const { data: config, isLoading } = useConfig(namespace);
  const saveConfig = useSaveConfig(namespace);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<Route | null>(null);

  const routes = config?.routes ?? [];
  const upstreamPoolIds = Object.keys(config?.upstream_pools ?? {});

  function saveNextConfig(nextConfig: typeof config, onSuccess: () => void) {
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
    setEditingRoute(null);
    setDialogOpen(true);
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setDialogOpen(true);
  };

  const handleDuplicate = (route: Route) => {
    const duplicated: Route = {
      ...route,
      id: `${route.id}-copy`,
    };
    setEditingRoute(duplicated);
    setDialogOpen(true);
  };

  const handleDelete = (route: Route) => {
    if (!config) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    if (confirm(`Are you sure you want to delete route "${route.id}"?`)) {
      saveNextConfig(deleteRouteFromConfig(config, route.id), () => {
        setEditingRoute(null);
      });
    }
  };

  const handleSubmit = (routeData: Route) => {
    if (!config) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    try {
      const nextConfig = editingRoute
        ? upsertRouteInConfig(config, editingRoute.id, routeData)
        : addRouteToConfig(config, routeData);

      saveNextConfig(nextConfig, () => {
        setDialogOpen(false);
        setEditingRoute(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
          <p className="text-muted-foreground">Manage request routing rules for the {namespace} namespace</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Route
        </Button>
      </div>

      <RoutesTable routes={routes} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} />

      <RouteDialog
        route={editingRoute}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRoute(null);
        }}
        upstreamPoolIds={upstreamPoolIds}
        onSubmit={handleSubmit}
        isSubmitting={saveConfig.isPending}
      />
    </div>
  );
}
