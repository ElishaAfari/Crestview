"use client";

import { useActionState } from "react";
import { PlusCircle } from "lucide-react";
import type { OperationsCreateField } from "@/config/operations";
import { createOperationsRecordAction } from "@/features/operations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type State = { ok: boolean; message: string };

const initialState: State = { ok: false, message: "" };

function defaultValue(field: OperationsCreateField) {
  if (field.type === "checkbox") return "on";
  if (field.type === "number") return "";
  return "";
}

function FieldControl({ field }: { field: OperationsCreateField }) {
  if (field.type === "textarea") {
    return <Textarea name={field.key} placeholder={field.placeholder} required={field.required} />;
  }
  if (field.type === "select") {
    return (
      <Select name={field.key} required={field.required} defaultValue={field.options?.[0]?.value ?? ""}>
        {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="portal-subtle-card mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-black text-[var(--portal-text)]">
        <input name={field.key} type="checkbox" defaultChecked value={defaultValue(field)} className="size-4 accent-[#174ea6]" />
        Enabled
      </label>
    );
  }
  return (
    <Input
      name={field.key}
      type={field.type === "datetime" ? "datetime-local" : field.type ?? "text"}
      inputMode={field.type === "number" ? "decimal" : undefined}
      step={field.type === "number" ? "0.01" : undefined}
      placeholder={field.placeholder}
      required={field.required}
    />
  );
}

export function OperationsRecordForm({
  workspaceKey,
  moduleKey,
  moduleLabel,
  fields
}: {
  workspaceKey: string;
  moduleKey: string;
  moduleLabel: string;
  fields: OperationsCreateField[];
}) {
  const [state, action, pending] = useActionState(
    createOperationsRecordAction.bind(null, workspaceKey, moduleKey),
    initialState
  );

  return (
    <form action={action} className="portal-subtle-card rounded-lg p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-black text-[var(--portal-text)]">Create {moduleLabel.toLowerCase()} record</h3>
          <p className="text-sm font-semibold text-[var(--portal-muted)]">Add a live operational record directly into this register.</p>
        </div>
        <Button type="submit" disabled={pending}>
          <PlusCircle className="size-4" aria-hidden />
          {pending ? "Saving..." : "Save record"}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : undefined}>
            <Label>{field.label}{field.required ? " *" : ""}</Label>
            <FieldControl field={field} />
          </div>
        ))}
      </div>
      {state.message ? (
        <p className={`mt-4 text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-200" : "text-red-700 dark:text-red-200"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
