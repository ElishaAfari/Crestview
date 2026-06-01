import type { RoleName } from "@/types/database.types";

export type OperationsWorkspaceKey = "hr" | "finance" | "library" | "it";

export type OperationsModule = {
  key: string;
  label: string;
  description: string;
  table: string;
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
      { key: "payroll", label: "Payroll periods", description: "Payroll windows and processing status.", table: "payroll_periods", fields: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }] }
    ]
  },
  {
    key: "finance",
    title: "Finance Workspace",
    description: "Invoices, payments, expenses, and payroll controls for school finance.",
    roles: ["finance_officer"],
    modules: [
      { key: "invoices", label: "Invoices", description: "Student invoices and due-date tracking.", table: "invoices", fields: [{ key: "invoice_number", label: "Invoice" }, { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "status", label: "Status" }, { key: "due_date", label: "Due" }] },
      { key: "payments", label: "Payments", description: "Recorded provider transactions and settlement state.", table: "payments", fields: [{ key: "provider", label: "Provider" }, { key: "provider_reference", label: "Reference" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "paid_at", label: "Paid" }] },
      { key: "expenses", label: "Expenses", description: "Expense submissions and approvals.", table: "expenses", fields: [{ key: "expense_number", label: "Expense" }, { key: "category", label: "Category" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "expense_date", label: "Date" }] },
      { key: "payroll", label: "Payroll periods", description: "Finance review of payroll windows.", table: "payroll_periods", fields: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }] }
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
      { key: "fines", label: "Fines", description: "Open, settled, and waived circulation charges.", table: "library_fines", fields: [{ key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }] }
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
      { key: "audit", label: "Audit log", description: "Recent protected data changes across the platform.", table: "audit_logs", fields: [{ key: "action", label: "Action" }, { key: "table_name", label: "Table" }, { key: "record_id", label: "Record" }, { key: "created_at", label: "Created" }] }
    ]
  }
];

export function findOperationsWorkspace(key: string) {
  return operationsWorkspaces.find((workspace) => workspace.key === key);
}
