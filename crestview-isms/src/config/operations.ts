import type { RoleName } from "@/types/database.types";

export type OperationsWorkspaceKey = "hr" | "finance" | "library" | "it";

export type OperationsModule = {
  key: string;
  label: string;
  description: string;
  table: string;
  filter?: { key: string; value: string };
  fields: Array<{ key: string; label: string }>;
};

export type OperationsWorkspace = {
  key: OperationsWorkspaceKey;
  title: string;
  description: string;
  roles: RoleName[];
  modules: OperationsModule[];
};

export const operationsWorkspaces: OperationsWorkspace[] = [
  {
    key: "hr",
    title: "HR Workspace",
    description: "People operations, staff records, leave, recruitment, and payroll readiness.",
    roles: ["hr_staff"],
    modules: [
      { key: "staff", label: "Staff profiles", description: "Employment records and staff identifiers.", table: "staff_profiles", fields: [{ key: "staff_number", label: "Staff number" }, { key: "job_title", label: "Job title" }, { key: "employment_type", label: "Employment" }, { key: "hire_date", label: "Hire date" }] },
      { key: "leave", label: "Leave requests", description: "Pending and reviewed staff leave requests.", table: "leave_requests", fields: [{ key: "leave_type", label: "Leave type" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }] },
      { key: "recruitment", label: "Applications", description: "Recruitment candidates and review status.", table: "job_applications", fields: [{ key: "first_name", label: "First name" }, { key: "last_name", label: "Last name" }, { key: "email", label: "Email" }, { key: "status", label: "Status" }, { key: "submitted_at", label: "Received" }] },
      { key: "payroll", label: "Payroll periods", description: "Payroll windows and processing status.", table: "payroll_periods", fields: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }] },
      { key: "documents", label: "Staff documents", description: "Employment documents, verification status, and expiry tracking.", table: "staff_documents", fields: [{ key: "document_type", label: "Document" }, { key: "status", label: "Status" }, { key: "expires_on", label: "Expires" }, { key: "required_for_employment", label: "Required" }] },
      { key: "tasks", label: "HR tasks", description: "People operations follow-ups and workflow tasks.", table: "workflow_tasks", filter: { key: "workflow_key", value: "hr_follow_up" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }] }
    ]
  },
  {
    key: "finance",
    title: "Finance Workspace",
    description: "Daily fees, QR payment checks, special invoices, expenses, and payroll controls for school finance.",
    roles: ["finance_officer"],
    modules: [
      { key: "payments", label: "Daily payments", description: "Daily fee captures from student ID or QR scans.", table: "daily_fee_payments", fields: [{ key: "payment_date", label: "Date" }, { key: "student_number", label: "Student ID" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "reference", label: "Reference" }] },
      { key: "billing-batches", label: "Daily fee plans", description: "Class-level daily fee amounts used by the finance QR desk.", table: "daily_fee_plans", fields: [{ key: "name", label: "Name" }, { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "is_active", label: "Active" }, { key: "effective_from", label: "From" }] },
      { key: "invoices", label: "Special invoices", description: "Exceptional student invoices outside normal daily fees.", table: "invoices", fields: [{ key: "invoice_number", label: "Invoice" }, { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "status", label: "Status" }, { key: "due_date", label: "Due" }] },
      { key: "expenses", label: "Expenses", description: "Expense submissions and approvals.", table: "expenses", fields: [{ key: "expense_number", label: "Expense" }, { key: "category", label: "Category" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "expense_date", label: "Date" }] },
      { key: "payroll", label: "Payroll periods", description: "Finance review of payroll windows.", table: "payroll_periods", fields: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }] },
      { key: "collections", label: "Collection tasks", description: "Payment follow-ups generated from invoices and billing batches.", table: "workflow_tasks", filter: { key: "workflow_key", value: "finance_collection" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }] }
    ]
  },
  {
    key: "library",
    title: "Library Workspace",
    description: "Catalog, physical copies, circulation, and fine registers.",
    roles: ["librarian"],
    modules: [
      { key: "catalog", label: "Book catalog", description: "Titles, authors, and categories.", table: "library_books", fields: [{ key: "title", label: "Title" }, { key: "authors", label: "Authors" }, { key: "isbn", label: "ISBN" }, { key: "category", label: "Category" }] },
      { key: "copies", label: "Book copies", description: "Barcode-level inventory and shelf state.", table: "library_copies", fields: [{ key: "barcode", label: "Barcode" }, { key: "shelf_location", label: "Shelf" }, { key: "status", label: "Status" }, { key: "acquired_on", label: "Acquired" }] },
      { key: "loans", label: "Loans", description: "Borrowed items, due dates, and returns.", table: "library_loans", fields: [{ key: "loaned_at", label: "Loaned" }, { key: "due_at", label: "Due" }, { key: "returned_at", label: "Returned" }, { key: "borrower_profile_id", label: "Borrower" }] },
      { key: "fines", label: "Fines", description: "Open, settled, and waived circulation charges.", table: "library_fines", fields: [{ key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }] },
      { key: "library-tasks", label: "Library tasks", description: "Circulation reminders, missing items, and follow-ups.", table: "workflow_tasks", filter: { key: "workflow_key", value: "library_follow_up" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }] }
    ]
  },
  {
    key: "it",
    title: "IT Support Workspace",
    description: "Device inventory, support tickets, integrations, and platform audit activity.",
    roles: ["it_support"],
    modules: [
      { key: "devices", label: "Devices", description: "School technology assets and assignment status.", table: "devices", fields: [{ key: "asset_tag", label: "Asset tag" }, { key: "name", label: "Device" }, { key: "device_type", label: "Type" }, { key: "status", label: "Status" }, { key: "location", label: "Location" }] },
      { key: "tickets", label: "Support tickets", description: "Open technical requests and resolution work.", table: "support_tickets", fields: [{ key: "ticket_number", label: "Ticket" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "category", label: "Category" }] },
      { key: "integrations", label: "Integration events", description: "External service delivery and processing events.", table: "integration_events", fields: [{ key: "source", label: "Source" }, { key: "event_type", label: "Event" }, { key: "external_id", label: "External ID" }, { key: "processed_at", label: "Processed" }, { key: "error", label: "Error" }] },
      { key: "audit", label: "Audit log", description: "Recent protected data changes across the platform.", table: "audit_logs", fields: [{ key: "action", label: "Action" }, { key: "table_name", label: "Table" }, { key: "record_id", label: "Record" }, { key: "created_at", label: "Created" }] },
      { key: "automation", label: "IT automation", description: "Platform jobs, support follow-ups, and integration work queue.", table: "workflow_tasks", filter: { key: "workflow_key", value: "it_support" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }] },
      { key: "messages", label: "System messages", description: "Queued email and SMS delivery records.", table: "email_outbox", fields: [{ key: "recipient_email", label: "Recipient" }, { key: "subject", label: "Subject" }, { key: "status", label: "Status" }, { key: "attempts", label: "Attempts" }, { key: "scheduled_for", label: "Scheduled" }] }
    ]
  }
];

export function findOperationsWorkspace(key: string) {
  return operationsWorkspaces.find((workspace) => workspace.key === key);
}
