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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { UpstreamPool, UpstreamPoolFormData } from "@/lib/types";
import { formDataToPool, poolToFormData } from "@/lib/types";
import { upstreamPoolFormSchema } from "@/lib/validation";

interface PoolFormProps {
  poolId?: string | null;
  pool?: UpstreamPool | null;
  onSubmit: (id: string, pool: UpstreamPool) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type FormischErrors = [string, ...string[]] | null;

const poolFieldErrors = (errors: FormischErrors) => errors?.map((message) => ({ message }));

const poolFieldA11y = (
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

export function PoolForm({
  poolId,
  pool,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PoolFormProps) {
  const form = useForm({
    schema: upstreamPoolFormSchema,
    initialInput:
      pool && poolId
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
  });

  const handleSubmit: SubmitHandler<typeof upstreamPoolFormSchema> = (values) => {
    onSubmit(values.id, formDataToPool(values as UpstreamPoolFormData));
  };

  return (
    <Form of={form} onSubmit={handleSubmit} className="space-y-6">
      <FormischField of={form} path={["id"]}>
        {(field) => (
          <Field data-invalid={field.errors !== null}>
            <FieldLabel htmlFor="pool-id">Pool ID</FieldLabel>
            <Input
              {...field.props}
              id="pool-id"
              placeholder="e.g., pool-api"
              value={field.input ?? ""}
              disabled={!!poolId}
              {...poolFieldA11y("pool-id", field.errors)}
            />
            <FieldDescription id="pool-id-description">Unique identifier for this upstream pool</FieldDescription>
            <FieldError id="pool-id-error" errors={poolFieldErrors(field.errors)} />
          </Field>
        )}
      </FormischField>

      <FieldArray of={form} path={["upstreams"]}>
        {(fieldArray) => (
          <FieldSet className="gap-4">
            <FieldLegend variant="label">Upstreams</FieldLegend>
            <FieldDescription>Backend server addresses in host:port format</FieldDescription>
            <FieldError errors={poolFieldErrors(fieldArray.errors)} />
            <FieldGroup className="gap-3">
              {fieldArray.items.map((item, index) => (
                <FormischField key={item} of={form} path={["upstreams", index]}>
                  {(field) => (
                    <Field data-invalid={field.errors !== null}>
                      <div className="flex gap-2">
                        <Input
                          {...field.props}
                          id={`pool-upstream-${index}`}
                          placeholder="e.g., 10.0.0.11:8080"
                          value={field.input ?? ""}
                          {...poolFieldA11y(`pool-upstream-${index}`, field.errors, { hasDescription: false })}
                        />
                        {fieldArray.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(form, { path: ["upstreams"], at: index })}
                            aria-label={`Remove upstream ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FieldError id={`pool-upstream-${index}-error`} errors={poolFieldErrors(field.errors)} />
                    </Field>
                  )}
                </FormischField>
              ))}
            </FieldGroup>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insert(form, { path: ["upstreams"], initialInput: "" })}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Upstream
            </Button>
          </FieldSet>
        )}
      </FieldArray>

      <Separator />

      <FormischField of={form} path={["health_check_enabled"]}>
        {(field) => (
          <>
            <Field orientation="horizontal" data-invalid={field.errors !== null}>
              <FieldContent>
                <FieldLabel htmlFor="pool-health-check-enabled">Health Check</FieldLabel>
                <FieldDescription id="pool-health-check-enabled-description">
                  Enable active health checking for upstreams
                </FieldDescription>
                <FieldError id="pool-health-check-enabled-error" errors={poolFieldErrors(field.errors)} />
              </FieldContent>
              <Switch
                id="pool-health-check-enabled"
                checked={field.input === true}
                onCheckedChange={field.onChange}
                {...poolFieldA11y("pool-health-check-enabled", field.errors)}
              />
            </Field>

            {field.input === true && (
              <div className="space-y-4 rounded-lg border p-4">
                <FormischField of={form} path={["health_check_path"]}>
                  {(pathField) => (
                    <Field data-invalid={pathField.errors !== null}>
                      <FieldLabel htmlFor="pool-health-check-path">Health Check Path</FieldLabel>
                      <Input
                        {...pathField.props}
                        id="pool-health-check-path"
                        placeholder="/health"
                        value={pathField.input ?? ""}
                        {...poolFieldA11y("pool-health-check-path", pathField.errors)}
                      />
                      <FieldDescription id="pool-health-check-path-description">
                        HTTP path for health check requests
                      </FieldDescription>
                      <FieldError id="pool-health-check-path-error" errors={poolFieldErrors(pathField.errors)} />
                    </Field>
                  )}
                </FormischField>

                <div className="grid grid-cols-2 gap-4">
                  <FormischField of={form} path={["health_check_interval"]}>
                    {(intervalField) => (
                      <Field data-invalid={intervalField.errors !== null}>
                        <FieldLabel htmlFor="pool-health-check-interval">Interval</FieldLabel>
                        <Input
                          {...intervalField.props}
                          id="pool-health-check-interval"
                          placeholder="30s"
                          value={intervalField.input ?? ""}
                          {...poolFieldA11y("pool-health-check-interval", intervalField.errors)}
                        />
                        <FieldDescription id="pool-health-check-interval-description">
                          Time between checks (e.g., 30s, 1m)
                        </FieldDescription>
                        <FieldError
                          id="pool-health-check-interval-error"
                          errors={poolFieldErrors(intervalField.errors)}
                        />
                      </Field>
                    )}
                  </FormischField>

                  <FormischField of={form} path={["health_check_timeout"]}>
                    {(timeoutField) => (
                      <Field data-invalid={timeoutField.errors !== null}>
                        <FieldLabel htmlFor="pool-health-check-timeout">Timeout</FieldLabel>
                        <Input
                          {...timeoutField.props}
                          id="pool-health-check-timeout"
                          placeholder="3s"
                          value={timeoutField.input ?? ""}
                          {...poolFieldA11y("pool-health-check-timeout", timeoutField.errors)}
                        />
                        <FieldDescription id="pool-health-check-timeout-description">
                          Request timeout (e.g., 3s, 500ms)
                        </FieldDescription>
                        <FieldError
                          id="pool-health-check-timeout-error"
                          errors={poolFieldErrors(timeoutField.errors)}
                        />
                      </Field>
                    )}
                  </FormischField>
                </div>

                <FormischField of={form} path={["health_check_expect_status"]}>
                  {(statusField) => (
                    <Field data-invalid={statusField.errors !== null}>
                      <FieldLabel htmlFor="pool-health-check-expect-status">Expected Status Code</FieldLabel>
                      <Input
                        {...statusField.props}
                        id="pool-health-check-expect-status"
                        type="number"
                        min={100}
                        max={599}
                        placeholder="200"
                        value={statusField.input ?? ""}
                        onChange={(event) => {
                          const { value, valueAsNumber } = event.currentTarget;
                          statusField.onChange(value === "" || Number.isNaN(valueAsNumber) ? undefined : valueAsNumber);
                        }}
                        {...poolFieldA11y("pool-health-check-expect-status", statusField.errors)}
                      />
                      <FieldDescription id="pool-health-check-expect-status-description">
                        HTTP status code indicating healthy state
                      </FieldDescription>
                      <FieldError
                        id="pool-health-check-expect-status-error"
                        errors={poolFieldErrors(statusField.errors)}
                      />
                    </Field>
                  )}
                </FormischField>
              </div>
            )}
          </>
        )}
      </FormischField>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || form.isSubmitting}>
          {isSubmitting || form.isSubmitting ? "Saving..." : poolId ? "Update Pool" : "Create Pool"}
        </Button>
      </div>
    </Form>
  );
}
