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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Route, RouteFormData } from "@/lib/types"
import { routeToFormData, formDataToRoute } from "@/lib/types"
import { routeFormSchema, type RouteFormValues } from "@/lib/validation"

interface RouteFormProps {
  route?: Route | null
  upstreamPoolIds: string[]
  onSubmit: (route: Route) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const NO_PATH_MATCH_VALUE = "__no_path_match__"

export function RouteForm({
  route,
  upstreamPoolIds,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RouteFormProps) {
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: route
      ? routeToFormData(route)
      : {
          id: "",
          enabled: true,
          hosts: [""],
          pathType: "",
          pathValue: "",
          upstream_pool: "",
        },
  })

  const handleSubmit = (values: RouteFormValues) => {
    const routeData = formDataToRoute(values as RouteFormData)
    onSubmit(routeData)
  }

  const hosts = form.watch("hosts")

  const addHost = () => {
    const currentHosts = form.getValues("hosts")
    form.setValue("hosts", [...currentHosts, ""])
  }

  const removeHost = (index: number) => {
    const currentHosts = form.getValues("hosts")
    if (currentHosts.length > 1) {
      form.setValue(
        "hosts",
        currentHosts.filter((_, i) => i !== index)
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
              <FormLabel>Route ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., r-api"
                  {...field}
                  disabled={!!route}
                />
              </FormControl>
              <FormDescription>
                Unique identifier for this route
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enabled</FormLabel>
                <FormDescription>
                  Enable or disable this route
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

        <div className="space-y-2">
          <FormLabel>Hosts</FormLabel>
          <FormDescription>
            Host domains to match (exact match only)
          </FormDescription>
          {hosts.map((_, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`hosts.${index}`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g., api.example.com"
                        {...field}
                      />
                    </FormControl>
                    {hosts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHost(index)}
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
            onClick={addHost}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Host
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pathType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Path Match Type</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(
                      value === NO_PATH_MATCH_VALUE ? "" : value
                    )
                  }
                  value={field.value === "" ? NO_PATH_MATCH_VALUE : field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_PATH_MATCH_VALUE}>
                      Any (no path match)
                    </SelectItem>
                    <SelectItem value="exact">Exact</SelectItem>
                    <SelectItem value="prefix">Prefix (segment)</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pathValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Path Value</FormLabel>
                <FormControl>
                  <Input
                    placeholder={form.watch("pathType") === "prefix" ? "/api/" : "/path"}
                    {...field}
                    disabled={!form.watch("pathType") || form.watch("pathType") === ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="upstream_pool"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upstream Pool</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pool" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {upstreamPoolIds.map((poolId) => (
                    <SelectItem key={poolId} value={poolId}>
                      {poolId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The upstream pool to route requests to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : route ? "Update Route" : "Create Route"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
