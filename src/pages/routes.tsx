import * as React from "react";
import { Plus } from "lucide-react";

import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute, useUpstreamPools } from "@/hooks/use-config";
import { useCurrentNamespace } from "@/hooks/use-namespace";
import type { Route } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RoutesTable } from "@/components/routes/routes-table";
import { RouteDialog } from "@/components/routes/route-dialog";

export function RoutesPage() {
  const namespace = useCurrentNamespace();
  const { data: routes = [], isLoading } = useRoutes(namespace);
  const { data: pools = {} } = useUpstreamPools(namespace);
  const createRoute = useCreateRoute(namespace);
  const updateRoute = useUpdateRoute(namespace);
  const deleteRoute = useDeleteRoute(namespace);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<Route | null>(null);

  const upstreamPoolIds = Object.keys(pools);

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
    if (confirm(`Are you sure you want to delete route "${route.id}"?`)) {
      deleteRoute.mutate(route.id);
    }
  };

  const handleSubmit = (routeData: Route) => {
    if (editingRoute && editingRoute.id !== routeData.id) {
      // Updating existing route with potentially changed ID
      updateRoute.mutate(
        { id: editingRoute.id, route: routeData },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingRoute(null);
          },
        },
      );
    } else if (editingRoute) {
      // Updating existing route
      updateRoute.mutate(
        { id: editingRoute.id, route: routeData },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingRoute(null);
          },
        },
      );
    } else {
      // Creating new route
      createRoute.mutate(routeData, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
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
        isSubmitting={createRoute.isPending || updateRoute.isPending}
      />
    </div>
  );
}
