import {
  Field as FormischField,
  FieldArray,
  Form,
  insert,
  remove,
  useForm,
  type SubmitHandler,
} from "@formisch/react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Route, RouteFormData } from "@/lib/types";
import { formDataToRoute, routeToFormData } from "@/lib/types";
import { routeFormSchema } from "@/lib/validation";

interface RouteFormProps {
  route?: Route | null;
  upstreamPoolIds: string[];
  onSubmit: (route: Route) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const NO_PATH_MATCH_VALUE = "__no_path_match__";
const ROUTE_ALGORITHMS = ["round_robin", "sticky_cookie", "5_tuple_hash", "least_connection"] as const;
type RoutePathTypeValue = "" | "exact" | "prefix" | "regex";
type RouteAlgorithmValue = (typeof ROUTE_ALGORITHMS)[number];
type FormischErrors = [string, ...string[]] | null;

const routeFieldErrors = (errors: FormischErrors) => errors?.map((message) => ({ message }));

const routeFieldA11y = (
  id: string,
  errors: FormischErrors,
  { hasDescription = true }: { hasDescription?: boolean } = {},
) => {
  const describedBy = [hasDescription ? `${id}-description` : undefined, errors ? `${id}-error` : undefined]
    .filter(Boolean)
    .join(" ");

  return {
    "aria-describedby": describedBy || undefined,
    "aria-errormessage": errors ? `${id}-error` : undefined,
    "aria-invalid": errors !== null,
  };
};

export function RouteForm({
  route,
  upstreamPoolIds,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RouteFormProps) {
  const form = useForm({
    schema: routeFormSchema,
    initialInput: route
      ? routeToFormData(route)
      : {
          id: "",
          enabled: true,
          hosts: [""],
          pathType: "",
          pathValue: "",
          algorithm: "round_robin",
          upstream_pool: "",
        },
  });

  const handleSubmit: SubmitHandler<typeof routeFormSchema> = (values) => {
    onSubmit(formDataToRoute(values as RouteFormData));
  };

  return (
    <Form of={form} onSubmit={handleSubmit} className="space-y-6">
      <FormischField of={form} path={["id"]}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel htmlFor="route-id">Route ID</FieldLabel>
            <Input
              {...field.props}
              id="route-id"
              placeholder="e.g., r-api"
              value={field.input ?? ""}
              disabled={!!route}
              {...routeFieldA11y("route-id", field.errors)}
            />
            <FieldDescription id="route-id-description">Unique identifier for this route</FieldDescription>
            <FieldError id="route-id-error" errors={routeFieldErrors(field.errors)} />
          </Field>
        )}
      </FormischField>

      <FormischField of={form} path={["enabled"]}>
        {(field) => (
          <Field orientation="horizontal" data-invalid={field.errors !== null}>
            <FieldContent>
              <FieldLabel htmlFor="route-enabled">Enabled</FieldLabel>
              <FieldDescription id="route-enabled-description">Enable or disable this route</FieldDescription>
              <FieldError id="route-enabled-error" errors={routeFieldErrors(field.errors)} />
            </FieldContent>
            <Switch
              id="route-enabled"
              checked={field.input === true}
              onCheckedChange={field.onChange}
              {...routeFieldA11y("route-enabled", field.errors)}
            />
          </Field>
        )}
      </FormischField>

      <FieldArray of={form} path={["hosts"]}>
        {(fieldArray) => (
          <FieldSet className="gap-4">
            <FieldLegend variant="label">Hosts</FieldLegend>
            <FieldDescription>Host domains to match (exact match only)</FieldDescription>
            <FieldError errors={routeFieldErrors(fieldArray.errors)} />
            <FieldGroup className="gap-3">
              {fieldArray.items.map((item, index) => (
                <FormischField key={item} of={form} path={["hosts", index]}>
                  {(field) => (
                    <Field data-invalid={field.errors !== null}>
                      <div className="flex gap-2">
                        <Input
                          {...field.props}
                          id={`route-host-${index}`}
                          placeholder="e.g., api.example.com"
                          value={field.input ?? ""}
                          {...routeFieldA11y(`route-host-${index}`, field.errors, { hasDescription: false })}
                        />
                        {fieldArray.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(form, { path: ["hosts"], at: index })}
                            aria-label={`Remove host ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FieldError id={`route-host-${index}-error`} errors={routeFieldErrors(field.errors)} />
                    </Field>
                  )}
                </FormischField>
              ))}
            </FieldGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insert(form, { path: ["hosts"], initialInput: "" })}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Host
            </Button>
          </FieldSet>
        )}
      </FieldArray>

      <div className="grid grid-cols-2 gap-4">
        <FormischField of={form} path={["pathType"]}>
          {(pathTypeField) => (
            <>
              <Field data-invalid={pathTypeField.errors !== null}>
                <FieldLabel htmlFor="route-path-type">Path Match Type</FieldLabel>
                <Select
                  onValueChange={(value) =>
                    pathTypeField.onChange((value === NO_PATH_MATCH_VALUE ? "" : value) as RoutePathTypeValue)
                  }
                  value={pathTypeField.input === "" ? NO_PATH_MATCH_VALUE : pathTypeField.input}
                >
                  <SelectTrigger
                    id="route-path-type"
                    {...routeFieldA11y("route-path-type", pathTypeField.errors, { hasDescription: false })}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PATH_MATCH_VALUE}>Any (no path match)</SelectItem>
                    <SelectItem value="exact">Exact</SelectItem>
                    <SelectItem value="prefix">Prefix (segment)</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError id="route-path-type-error" errors={routeFieldErrors(pathTypeField.errors)} />
              </Field>

              <FormischField of={form} path={["pathValue"]}>
                {(pathValueField) => (
                  <Field data-invalid={pathValueField.errors !== null}>
                    <FieldLabel htmlFor="route-path-value">Path Value</FieldLabel>
                    <Input
                      {...pathValueField.props}
                      id="route-path-value"
                      placeholder={pathTypeField.input === "prefix" ? "/api/" : "/path"}
                      value={pathValueField.input ?? ""}
                      disabled={!pathTypeField.input}
                      {...routeFieldA11y("route-path-value", pathValueField.errors, { hasDescription: false })}
                    />
                    <FieldError id="route-path-value-error" errors={routeFieldErrors(pathValueField.errors)} />
                  </Field>
                )}
              </FormischField>
            </>
          )}
        </FormischField>
      </div>

      <FormischField of={form} path={["algorithm"]}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel htmlFor="route-algorithm">Algorithm</FieldLabel>
            <Select onValueChange={(value) => field.onChange(value as RouteAlgorithmValue)} value={field.input}>
              <SelectTrigger id="route-algorithm" {...routeFieldA11y("route-algorithm", field.errors)}>
                <SelectValue placeholder="Select an algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">Round robin</SelectItem>
                <SelectItem value="sticky_cookie">Sticky cookie</SelectItem>
                <SelectItem value="5_tuple_hash">5-tuple hash</SelectItem>
                <SelectItem value="least_connection">Least connection</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription id="route-algorithm-description">
              Load-balancing algorithm for this route
            </FieldDescription>
            <FieldError id="route-algorithm-error" errors={routeFieldErrors(field.errors)} />
          </Field>
        )}
      </FormischField>

      <FormischField of={form} path={["upstream_pool"]}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel htmlFor="route-upstream-pool">Upstream Pool</FieldLabel>
            <Select onValueChange={field.onChange} value={field.input}>
              <SelectTrigger id="route-upstream-pool" {...routeFieldA11y("route-upstream-pool", field.errors)}>
                <SelectValue placeholder="Select a pool" />
              </SelectTrigger>
              <SelectContent>
                {upstreamPoolIds.map((poolId) => (
                  <SelectItem key={poolId} value={poolId}>
                    {poolId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription id="route-upstream-pool-description">
              The upstream pool to route requests to
            </FieldDescription>
            <FieldError id="route-upstream-pool-error" errors={routeFieldErrors(field.errors)} />
          </Field>
        )}
      </FormischField>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || form.isSubmitting}>
          {isSubmitting || form.isSubmitting ? "Saving..." : route ? "Update Route" : "Create Route"}
        </Button>
      </div>
    </Form>
  );
}
