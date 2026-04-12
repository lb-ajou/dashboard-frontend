import * as React from "react";
import { Plus } from "lucide-react";

import {
  useUpstreamPools,
  useCreateUpstreamPool,
  useUpdateUpstreamPool,
  useDeleteUpstreamPool,
} from "@/hooks/use-config";
import { useCurrentNamespace } from "@/hooks/use-namespace";
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
  const { data: pools = {}, isLoading } = useUpstreamPools(namespace);
  const createPool = useCreateUpstreamPool(namespace);
  const updatePool = useUpdateUpstreamPool(namespace);
  const deletePool = useDeleteUpstreamPool(namespace);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPoolId, setEditingPoolId] = React.useState<string | null>(null);
  const [editingPool, setEditingPool] = React.useState<UpstreamPool | null>(null);

  // Convert Record to array for table
  const poolsArray: PoolWithId[] = React.useMemo(() => {
    return Object.entries(pools).map(([id, pool]) => ({ id, pool }));
  }, [pools]);

  const handleCreate = () => {
    setEditingPoolId(null);
    setEditingPool(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string, pool: UpstreamPool) => {
    setEditingPoolId(id);
    setEditingPool(pool);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete upstream pool "${id}"?`)) {
      deletePool.mutate(id);
    }
  };

  const handleSubmit = (id: string, poolData: UpstreamPool) => {
    if (editingPoolId) {
      // Updating existing pool
      updatePool.mutate(
        { id: editingPoolId, pool: poolData },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingPoolId(null);
            setEditingPool(null);
          },
        },
      );
    } else {
      // Creating new pool
      createPool.mutate(
        { id, pool: poolData },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        },
      );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upstream Pools</h1>
          <p className="text-muted-foreground">Manage backend server pools for the {namespace} namespace</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Pool
        </Button>
      </div>

      <PoolsTable pools={poolsArray} onEdit={handleEdit} onDelete={handleDelete} />

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
        isSubmitting={createPool.isPending || updatePool.isPending}
      />
    </div>
  );
}
