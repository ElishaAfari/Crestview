"use client";

import { useActionState, useRef } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { createJobPostingAction } from "@/features/recruitment/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type State = { ok: boolean; message: string };
const initialState: State = { ok: false, message: "" };

export function JobPostingForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (_: State, formData: FormData) => {
    const result = await createJobPostingAction(formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={action} className="grid gap-4 lg:grid-cols-2">
      <div>
        <Label>Role title</Label>
        <Input required name="title" placeholder="STEM / Robotics Teacher" />
      </div>
      <div>
        <Label>Employment type</Label>
        <Select name="employmentType" defaultValue="full_time">
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="contract">Contract</option>
          <option value="intern">Intern</option>
        </Select>
      </div>
      <div>
        <Label>Closing date</Label>
        <Input name="closesOn" type="date" />
      </div>
      <div>
        <Label>Website visibility</Label>
        <Select name="isActive" defaultValue="true">
          <option value="true">Publish now</option>
          <option value="false">Save inactive</option>
        </Select>
      </div>
      <div className="lg:col-span-2">
        <Label>Role description</Label>
        <Textarea required name="description" placeholder="Describe responsibilities, qualifications, and the kind of teacher or staff member Crestview needs." />
      </div>
      <div className="flex flex-col items-start gap-3 lg:col-span-2">
        <Button type="submit" disabled={pending}>
          <BriefcaseBusiness className="size-4" aria-hidden />
          {pending ? "Creating..." : "Create recruitment posting"}
        </Button>
        {state.message ? <p className={`text-sm font-black ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
