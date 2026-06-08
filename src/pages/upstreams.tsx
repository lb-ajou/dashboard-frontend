import * as React from "react";
import { Plus } from "lucide-react";

import { ApiErrorMessage } from "@/components/dashboard/api-error-message";
import { ProjectionStatusBanner } from "@/components/dashboard/projection-status-banner";
import { PoolDialog } from "@/components/upstreams/pool-dialog";
import { PoolsTable } from "@/components/upstreams/pools-table";
import { Button } from "@/components/ui/button";
import { useConfig, useRuntime, useSaveConfig, useStatus } from "@/hooks/use-config";
import {
  addUpstreamPool,
  deleteUpstreamPool,
  replaceUpstreamPool,
  toReplaceConfigRequest,
} from "@/lib/config-mutations";
import type { UpstreamPool } from "@/lib/types";
import { getWriteAvailability } from "@/lib/write-availability";

interface PoolWithId {
  id: string;
  pool: UpstreamPool;
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to save configuration.";
}

export function UpstreamsPage() {
  const { data: config, isLoading, error } = useConfig();
  const { data: runtime, isLoading: runtimeLoading, error: runtimeError } = useRuntime();
  const { data: status } = useStatus();
  const saveConfig = useSaveConfig();
  const writeAvailability = getWriteAvailability(status);
  const canWrite = writeAvailability.canWrite;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPoolId, setEditingPoolId] = React.useState<string | null>(null);
  const [editingPool, setEditingPool] = React.useState<UpstreamPool | null>(null);

  const poolsArray: PoolWithId[] = React.useMemo(() => {
    return Object.entries(config?.upstream_pools ?? {}).map(([id, pool]) => ({ id, pool }));
  }, [config?.upstream_pools]);
  const activeConnectionPoolIds = React.useMemo(() => {
    return new Set(
      (config?.routes ?? [])
        .filter((route) => route.algorithm === "least_connection")
        .map((route) => route.upstream_pool),
    );
  }, [config?.routes]);

  const isSaving = saveConfig.isPending;

  const saveNextConfig = (nextPoolConfig: NonNullable<typeof config>, onSuccess?: () => void) => {
    saveConfig.mutate(toReplaceConfigRequest(nextPoolConfig), { onSuccess });
  };

  const handleCreate = () => {
    if (!canWrite || isLoading || isSaving) return;
    setEditingPoolId(null);
    setEditingPool(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string, pool: UpstreamPool) => {
    if (!canWrite || isSaving) return;
    setEditingPoolId(id);
    setEditingPool(pool);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!config || !canWrite || isSaving) return;

    if (confirm(`Are you sure you want to delete upstream pool "${id}"?`)) {
      try {
        const nextConfig = deleteUpstreamPool(config, id);
        saveNextConfig(nextConfig);
      } catch (err) {
        alert(mutationErrorMessage(err));
      }
    }
  };

  const handleSubmit = (id: string, poolData: UpstreamPool) => {
    if (!config || !canWrite || isSaving) return;

    try {
      const nextConfig = editingPoolId
        ? replaceUpstreamPool(config, editingPoolId, id, poolData)
        : addUpstreamPool(config, id, poolData);

      saveNextConfig(nextConfig, () => {
        setDialogOpen(false);
        setEditingPoolId(null);
        setEditingPool(null);
      });
    } catch (err) {
      alert(mutationErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upstream Pools</h1>
          <p className="text-muted-foreground">Manage desired backend server pools.</p>
          {!canWrite ? <p className="mt-2 text-sm text-muted-foreground">{writeAvailability.reason}</p> : null}
        </div>
        <Button onClick={handleCreate} disabled={!canWrite || isLoading || isSaving}>
          <Plus className="size-4" />
          Create Pool
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      <ApiErrorMessage error={saveConfig.error} fallback="Failed to save upstream pool configuration." />
      <ProjectionStatusBanner status={status} compact hideWhenApplied />

      <PoolsTable
        pools={poolsArray}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canWrite={canWrite && !isSaving}
        runtimeUpstreams={runtime?.upstreams}
        runtimeLoading={runtimeLoading}
        runtimeUnavailable={Boolean(runtimeError)}
        activeConnectionPoolIds={activeConnectionPoolIds}
      />

      <PoolDialog
        poolId={editingPoolId}
        pool={editingPool}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingPoolId(null);
            setEditingPool(null);
          }
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
      />
    </div>
  );
}
