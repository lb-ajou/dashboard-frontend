import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PoolForm } from "./pool-form"
import type { UpstreamPool } from "@/lib/types"

interface PoolDialogProps {
  poolId: string | null
  pool: UpstreamPool | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, pool: UpstreamPool) => void
  isSubmitting?: boolean
}

export function PoolDialog({
  poolId,
  pool,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: PoolDialogProps) {
  const handleSubmit = (id: string, poolData: UpstreamPool) => {
    onSubmit(id, poolData)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {poolId ? "Edit Upstream Pool" : "Create Upstream Pool"}
          </DialogTitle>
          <DialogDescription>
            {poolId
              ? "Update the upstream pool configuration"
              : "Add a new upstream pool to your reverse proxy"}
          </DialogDescription>
        </DialogHeader>
        <PoolForm
          key={`${poolId ? "edit" : "create"}-${poolId ?? "new"}`}
          poolId={poolId}
          pool={pool}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
