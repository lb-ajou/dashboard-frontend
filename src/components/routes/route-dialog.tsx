import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RouteForm } from "./route-form"
import type { Route } from "@/lib/types"

interface RouteDialogProps {
  route: Route | null
  open: boolean
  onOpenChange: (open: boolean) => void
  upstreamPoolIds: string[]
  onSubmit: (route: Route) => void
  isSubmitting?: boolean
}

export function RouteDialog({
  route,
  open,
  onOpenChange,
  upstreamPoolIds,
  onSubmit,
  isSubmitting = false,
}: RouteDialogProps) {
  const handleSubmit = (routeData: Route) => {
    onSubmit(routeData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {route ? "Edit Route" : "Create Route"}
          </DialogTitle>
          <DialogDescription>
            {route
              ? "Update the route configuration"
              : "Add a new route to your reverse proxy"}
          </DialogDescription>
        </DialogHeader>
        <RouteForm
          route={route}
          upstreamPoolIds={upstreamPoolIds}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
