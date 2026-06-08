import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StatusView } from "@/lib/api-types";
import { getProjectionApplicationStatus } from "@/lib/projection-status";
import { cn } from "@/lib/utils";

interface ProjectionStatusBannerProps {
  status: StatusView | undefined;
  compact?: boolean;
  hideWhenApplied?: boolean;
}

export function ProjectionStatusBanner({
  status,
  compact = false,
  hideWhenApplied = false,
}: ProjectionStatusBannerProps) {
  const projection = getProjectionApplicationStatus(status);

  if (hideWhenApplied && projection.state === "applied") {
    return null;
  }

  const Icon =
    projection.state === "applied" ? CheckCircle2 : projection.state === "loading" ? Clock : AlertTriangle;
  const badgeVariant =
    projection.state === "error" ? "destructive" : projection.state === "applied" ? "default" : "secondary";
  const warningState = projection.state === "error" || projection.state === "pending";

  return (
    <Card className={cn("py-0", warningState && "border-destructive/40")}>
      <CardContent
        className={
          compact
            ? "flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between"
            : "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{projection.label}</p>
              {projection.projectionStatus ? <Badge variant={badgeVariant}>{projection.projectionStatus}</Badge> : null}
            </div>
            <p className="break-words text-sm text-muted-foreground">{projection.description}</p>
          </div>
        </div>
        {projection.appliedAt ? (
          <p
            className={
              compact
                ? "pl-7 text-xs text-muted-foreground sm:shrink-0 sm:pl-0"
                : "shrink-0 text-xs text-muted-foreground"
            }
          >
            Applied at {projection.appliedAt}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
