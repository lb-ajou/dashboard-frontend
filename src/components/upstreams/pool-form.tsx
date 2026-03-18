import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { UpstreamPool, UpstreamPoolFormData } from "@/lib/types"
import { poolToFormData, formDataToPool } from "@/lib/types"
import { upstreamPoolFormSchema, type UpstreamPoolFormValues } from "@/lib/validation"

interface PoolFormProps {
  poolId?: string | null
  pool?: UpstreamPool | null
  onSubmit: (id: string, pool: UpstreamPool) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function PoolForm({
  poolId,
  pool,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PoolFormProps) {
  const form = useForm<UpstreamPoolFormValues>({
    resolver: zodResolver(upstreamPoolFormSchema),
    defaultValues: pool && poolId
      ? poolToFormData(poolId, pool)
      : {
          id: "",
          upstreams: [""],
          health_check_enabled: false,
          health_check_path: "/health",
          health_check_interval: "30s",
          health_check_timeout: "3s",
          health_check_expect_status: 200,
        },
  })

  const handleSubmit = (values: UpstreamPoolFormValues) => {
    const poolData = formDataToPool(values as UpstreamPoolFormData)
    onSubmit(values.id, poolData)
  }

  const upstreams = form.watch("upstreams")
  const healthCheckEnabled = form.watch("health_check_enabled")

  const addUpstream = () => {
    const currentUpstreams = form.getValues("upstreams")
    form.setValue("upstreams", [...currentUpstreams, ""])
  }

  const removeUpstream = (index: number) => {
    const currentUpstreams = form.getValues("upstreams")
    if (currentUpstreams.length > 1) {
      form.setValue(
        "upstreams",
        currentUpstreams.filter((_, i) => i !== index)
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pool ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., pool-api"
                  {...field}
                  disabled={!!poolId}
                />
              </FormControl>
              <FormDescription>
                Unique identifier for this upstream pool
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Upstreams</FormLabel>
          <FormDescription>
            Backend server addresses in host:port format
          </FormDescription>
          {upstreams.map((_, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`upstreams.${index}`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g., 10.0.0.11:8080"
                        {...field}
                      />
                    </FormControl>
                    {upstreams.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUpstream(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addUpstream}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Upstream
          </Button>
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="health_check_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Health Check</FormLabel>
                <FormDescription>
                  Enable active health checking for upstreams
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {healthCheckEnabled && (
          <div className="space-y-4 rounded-lg border p-4">
            <FormField
              control={form.control}
              name="health_check_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Check Path</FormLabel>
                  <FormControl>
                    <Input placeholder="/health" {...field} />
                  </FormControl>
                  <FormDescription>
                    HTTP path for health check requests
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="health_check_interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interval</FormLabel>
                    <FormControl>
                      <Input placeholder="30s" {...field} />
                    </FormControl>
                    <FormDescription>
                      Time between checks (e.g., 30s, 1m)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="health_check_timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout</FormLabel>
                    <FormControl>
                      <Input placeholder="3s" {...field} />
                    </FormControl>
                    <FormDescription>
                      Request timeout (e.g., 3s, 500ms)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="health_check_expect_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Status Code</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={100}
                      max={599}
                      placeholder="200"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 200)}
                    />
                  </FormControl>
                  <FormDescription>
                    HTTP status code indicating healthy state
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : poolId ? "Update Pool" : "Create Pool"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
