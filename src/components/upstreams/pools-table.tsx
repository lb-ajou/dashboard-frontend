import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RuntimeUpstreamView } from "@/lib/api-types";
import type { UpstreamPool } from "@/lib/types";
import { getUpstreamTargetRuntimeStatuses, type UpstreamTargetRuntimeStatus } from "@/lib/upstream-runtime-status";

interface PoolWithId {
  id: string;
  pool: UpstreamPool;
}

interface PoolsTableProps {
  pools: PoolWithId[];
  onEdit: (id: string, pool: UpstreamPool) => void;
  onDelete: (id: string) => void;
  canWrite?: boolean;
  runtimeUpstreams?: RuntimeUpstreamView[];
  runtimeLoading?: boolean;
  runtimeUnavailable?: boolean;
  activeConnectionPoolIds?: ReadonlySet<string>;
}

function runtimeBadgeVariant(state: UpstreamTargetRuntimeStatus["state"]) {
  if (state === "healthy") return "default";
  if (state === "unhealthy") return "destructive";
  if (state === "not_applied") return "secondary";
  return "outline";
}

function RuntimeHealthBadge({ target }: { target: UpstreamTargetRuntimeStatus }) {
  const badge = <Badge variant={runtimeBadgeVariant(target.state)}>{target.label}</Badge>;

  if (target.state !== "unhealthy" || !target.lastError) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-xs break-words">{target.lastError}</TooltipContent>
    </Tooltip>
  );
}

export function PoolsTable({
  pools,
  onEdit,
  onDelete,
  canWrite = true,
  runtimeUpstreams,
  runtimeLoading = false,
  runtimeUnavailable = false,
  activeConnectionPoolIds,
}: PoolsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<PoolWithId>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Pool ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "pool.health_check",
      header: "Health Check",
      cell: ({ row }) => {
        const hc = row.original.pool.health_check;
        if (!hc) {
          return <Badge variant="secondary">Disabled</Badge>;
        }
        return (
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-500" />
              <span>{hc.path}</span>
            </div>
            <div className="text-muted-foreground">
              {hc.interval} / {hc.timeout} timeout
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "pool.upstreams",
      header: "Upstreams",
      cell: ({ row }) => {
        const { id, pool } = row.original;
        const targetStatuses = getUpstreamTargetRuntimeStatuses({
          poolId: id,
          upstreams: pool.upstreams,
          runtimeUpstreams,
          runtimeLoading,
          runtimeUnavailable,
          showActiveConnections: activeConnectionPoolIds?.has(id) ?? false,
        });

        return (
          <div className="grid gap-2">
            {targetStatuses.map((target, targetIndex) => (
              <div
                key={`${target.address}-${targetIndex}`}
                className="grid gap-1 rounded-md bg-muted/40 p-2 text-xs"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <code className="break-all">{target.address}</code>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {target.activeConnections !== undefined ? (
                      <span className="text-muted-foreground">{target.activeConnections} active</span>
                    ) : null}
                    <RuntimeHealthBadge target={target} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const { id, pool } = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!canWrite} onClick={() => onEdit(id, pool)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!canWrite} onClick={() => onDelete(id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: pools,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by Pool ID..."
          value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("id")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No upstream pools found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} pool(s)</div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
