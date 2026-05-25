import * as React from "react";
import { Plus } from "lucide-react";

import { useConfig, useSaveConfig } from "@/hooks/use-config";
import { useCurrentNamespace } from "@/hooks/use-namespace";
import { deletePoolFromConfig, renamePoolInConfig, toPutRequest, upsertPoolInConfig } from "@/lib/config-mutations";
import { formatApiError } from "@/lib/api-client";
import type { UpstreamPool } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PoolsTable } from "@/components/upstreams/pools-table";
import { PoolDialog } from "@/components/upstreams/pool-dialog";

interface PoolWithId {
  id: string;
  pool: UpstreamPool;
}

export function UpstreamsPage() {
  const namespace = useCurrentNamespace();
  const { data: config, isLoading, isError, error } = useConfig(namespace);
  const saveConfig = useSaveConfig(namespace);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPoolId, setEditingPoolId] = React.useState<string | null>(null);
  const [editingPool, setEditingPool] = React.useState<UpstreamPool | null>(null);

  const poolsArray: PoolWithId[] = React.useMemo(() => {
    return Object.entries(config?.upstream_pools ?? {}).map(([id, pool]) => ({ id, pool }));
  }, [config?.upstream_pools]);

  const isSaving = saveConfig.isPending;
  const canCreate = !!config && !isSaving;

  function saveNextConfig(nextConfig: typeof config, onSuccess: () => void) {
    if (isSaving) {
      window.alert("An upstream pool save is already in progress.");
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

    setEditingPoolId(null);
    setEditingPool(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string, pool: UpstreamPool) => {
    if (isSaving) {
      return;
    }

    setEditingPoolId(id);
    setEditingPool(pool);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (isSaving) {
      window.alert("An upstream pool save is already in progress.");
      return;
    }

    if (!config) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    if (confirm(`Are you sure you want to delete upstream pool "${id}"?`)) {
      try {
        saveNextConfig(deletePoolFromConfig(config, id), () => {
          setEditingPoolId(null);
          setEditingPool(null);
        });
      } catch (error) {
        window.alert(formatApiError(error));
      }
    }
  };

  const handleSubmit = (id: string, poolData: UpstreamPool) => {
    if (isSaving) {
      window.alert("An upstream pool save is already in progress.");
      return;
    }

    if (!config) {
      window.alert("Namespace config is not loaded yet.");
      return;
    }

    try {
      if (!editingPoolId && Object.prototype.hasOwnProperty.call(config.upstream_pools, id)) {
        window.alert(formatApiError(new Error(`Upstream pool id already exists: ${id}`)));
        return;
      }

      const nextConfig = editingPoolId
        ? renamePoolInConfig(config, editingPoolId, id, poolData)
        : upsertPoolInConfig(config, id, poolData);

      saveNextConfig(nextConfig, () => {
        setDialogOpen(false);
        setEditingPoolId(null);
        setEditingPool(null);
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
            <h1 className="text-3xl font-bold tracking-tight">Upstream Pools</h1>
            <p className="text-muted-foreground">Loading {namespace} upstream pools...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Upstream Pools</h1>
            <p className="text-muted-foreground">Unable to load {namespace} upstream pools.</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Pool
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
          <h1 className="text-3xl font-bold tracking-tight">Upstream Pools</h1>
          <p className="text-muted-foreground">Manage backend server pools for the {namespace} namespace</p>
        </div>
        <Button onClick={handleCreate} disabled={!canCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Pool
        </Button>
      </div>

      <PoolsTable pools={poolsArray} onEdit={handleEdit} onDelete={handleDelete} disabled={isSaving} />

      <PoolDialog
        poolId={editingPoolId}
        pool={editingPool}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (isSaving) {
            return;
          }

          setDialogOpen(open);
          if (!open) {
            setEditingPoolId(null);
            setEditingPool(null);
          }
        }}
        onSubmit={handleSubmit}
        isSubmitting={saveConfig.isPending}
      />
    </div>
  );
}
