import type { RoleName } from "@/types/database.types";

export type OperationsWorkspaceKey =
  | "students"
  | "staff"
  | "classes"
  | "attendance"
  | "assessment"
  | "admissions-office"
  | "messages"
  | "calendar"
  | "reports"
  | "hr"
  | "finance"
  | "library"
  | "it"
  | "front-office"
  | "id-cards"
  | "preschool"
  | "academics-office"
  | "exams"
  | "communication"
  | "bursary"
  | "accounting"
  | "feeding"
  | "extra-classes"
  | "boarding"
  | "transport"
  | "inventory"
  | "learner-care"
  | "platform-audit";

export type OperationsCreateField = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "number" | "date" | "datetime" | "time" | "select" | "tags" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type OperationsModule = {
  key: string;
  label: string;
  description: string;
  table: string;
  filter?: { key: string; value: string };
  softDelete?: boolean;
  fields: Array<{ key: string; label: string }>;
  searchFields?: string[];
  createFields?: OperationsCreateField[];
};

export type OperationsQuickAction = {
  label: string;
  description: string;
  href: string;
};

export type OperationsWorkspace = {
  key: OperationsWorkspaceKey;
  title: string;
  description: string;
  roles: RoleName[];
  modules: OperationsModule[];
  quickActions?: OperationsQuickAction[];
};

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" }
];

const audienceRoleHint = "student, parent, teacher, staff";

const paymentMethodOptions = [
  { label: "Cash", value: "cash" },
  { label: "Mobile money", value: "mobile_money" },
  { label: "Card", value: "card" },
  { label: "Bank", value: "bank" },
  { label: "Other", value: "other" }
];

export const operationsWorkspaces: OperationsWorkspace[] = [
  {
    key: "students",
    title: "Students",
    description: "Learner directory, guardian links, attendance context, reports, and Student 360 records.",
    roles: [],
    quickActions: [
      { label: "Add student", description: "Open the enrolment form", href: "/admin/students#add-student" },
      { label: "Student 360", description: "Connected learner view", href: "/admin/student-360" },
      { label: "ID cards", description: "Print learner cards", href: "/id-cards" },
      { label: "Export register", description: "Download student records", href: "/students/student-directory" }
    ],
    modules: [
      {
        key: "student-directory",
        label: "Student directory",
        description: "Searchable learner roll with student IDs, class placement, enrolment state, and lifecycle status.",
        table: "students",
        fields: [
          { key: "student_number", label: "Student ID" },
          { key: "classroom_id", label: "Class" },
          { key: "enrollment_date", label: "Enrolled" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["student_number", "status"]
      },
      {
        key: "guardian-links",
        label: "Guardian links",
        description: "Parent and guardian relationships used for billing, communication, reports, and account access.",
        table: "parent_students",
        fields: [
          { key: "parent_profile_id", label: "Parent profile" },
          { key: "student_id", label: "Student" },
          { key: "relationship", label: "Relationship" }
        ],
        searchFields: ["relationship", "parent_profile_id", "student_id"]
      },
      {
        key: "attendance-context",
        label: "Attendance context",
        description: "Recent attendance records connected to the learner roll.",
        table: "attendance_records",
        fields: [
          { key: "attendance_date", label: "Date" },
          { key: "student_id", label: "Student" },
          { key: "classroom_id", label: "Class" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["status", "student_id", "classroom_id", "notes"]
      },
      {
        key: "academic-reports",
        label: "Academic reports",
        description: "Generated report cards and publication status by learner.",
        table: "reports",
        fields: [
          { key: "report_number", label: "Report" },
          { key: "student_id", label: "Student" },
          { key: "term", label: "Term" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["report_number", "title", "term", "status", "summary"]
      }
    ]
  },
  {
    key: "staff",
    title: "Staff",
    description: "Staff directory, teaching assignments, leave requests, payroll windows, and recruitment context.",
    roles: ["hr_staff"],
    quickActions: [
      { label: "Add staff", description: "Create a staff profile", href: "/admin/staff#add-staff" },
      { label: "Recruitment", description: "Review applicants", href: "/admin/recruitment" },
      { label: "Leave desk", description: "Manage leave", href: "/hr/leave" },
      { label: "Staff cards", description: "Print staff IDs", href: "/id-cards/staff-cards" }
    ],
    modules: [
      {
        key: "staff-directory",
        label: "Staff directory",
        description: "Profiles for administrators, teachers, finance, HR, library, and IT staff.",
        table: "profiles",
        fields: [
          { key: "first_name", label: "First name" },
          { key: "last_name", label: "Last name" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["first_name", "last_name", "email", "phone", "status"]
      },
      {
        key: "class-assignments",
        label: "Class assignments",
        description: "Teacher and staff class responsibilities for access control and reports.",
        table: "staff_class_assignments",
        fields: [
          { key: "profile_id", label: "Staff" },
          { key: "classroom_id", label: "Class" },
          { key: "assignment_type", label: "Assignment" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["profile_id", "classroom_id", "assignment_type", "status", "notes"]
      },
      {
        key: "leave-requests",
        label: "Leave requests",
        description: "Submitted, approved, rejected, and pending staff leave records.",
        table: "leave_requests",
        fields: [
          { key: "staff_profile_id", label: "Staff" },
          { key: "leave_type", label: "Leave type" },
          { key: "starts_on", label: "Starts" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["leave_type", "status", "reason", "staff_profile_id"]
      },
      {
        key: "payroll-periods",
        label: "Payroll periods",
        description: "Payroll windows and processing status for staff compensation.",
        table: "payroll_periods",
        fields: [
          { key: "name", label: "Period" },
          { key: "starts_on", label: "Starts" },
          { key: "ends_on", label: "Ends" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["name", "status"]
      }
    ]
  },
  {
    key: "classes",
    title: "Classes & Sections",
    description: "Class structures, subject assignments, timetable coverage, and teacher access boundaries.",
    roles: [],
    quickActions: [
      { label: "Assign subjects", description: "Manage subject coverage", href: "/academics-office/curriculum-units" },
      { label: "Timetable", description: "Review periods", href: "/academics-office/timetable" },
      { label: "Class rosters", description: "Teacher roster tools", href: "/teacher/classes" },
      { label: "Attendance", description: "Mark daily registers", href: "/attendance" }
    ],
    modules: [
      {
        key: "class-register",
        label: "Class register",
        description: "Classes, grade levels, capacity, rooms, and academic-year grouping.",
        table: "classrooms",
        fields: [
          { key: "name", label: "Class" },
          { key: "grade_level", label: "Level" },
          { key: "capacity", label: "Capacity" },
          { key: "room_number", label: "Room" }
        ],
        searchFields: ["name", "grade_level", "room_number"]
      },
      {
        key: "subject-coverage",
        label: "Subject coverage",
        description: "Course records connecting subjects to classes, teachers, academic years, and terms.",
        table: "courses",
        fields: [
          { key: "subject_id", label: "Subject" },
          { key: "classroom_id", label: "Class" },
          { key: "teacher_id", label: "Teacher" },
          { key: "term", label: "Term" }
        ],
        searchFields: ["subject_id", "classroom_id", "teacher_id", "term"]
      },
      {
        key: "timetable",
        label: "Timetable",
        description: "Class periods, subject timing, rooms, and teacher scheduling checks.",
        table: "timetables",
        fields: [
          { key: "day_of_week", label: "Day" },
          { key: "starts_at", label: "Starts" },
          { key: "ends_at", label: "Ends" },
          { key: "room_number", label: "Room" }
        ],
        searchFields: ["day_of_week", "room_number"]
      },
      {
        key: "schemes",
        label: "Schemes of learning",
        description: "Weekly subject plans, topics, objectives, resources, and completion status.",
        table: "class_subject_schemes",
        fields: [
          { key: "grade_level", label: "Level" },
          { key: "subject_name", label: "Subject" },
          { key: "term", label: "Term" },
          { key: "week_number", label: "Week" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["grade_level", "subject_name", "term", "topic", "objectives", "resources", "status"]
      }
    ]
  },
  {
    key: "attendance",
    title: "Attendance",
    description: "Daily class registers, QR scan records, class completion status, and attendance risk monitoring.",
    roles: [],
    quickActions: [
      { label: "Mark attendance", description: "Open daily register", href: "/teacher/attendance" },
      { label: "Admin monitor", description: "Whole-school overview", href: "/admin/attendance" },
      { label: "Student 360", description: "Attendance risk view", href: "/admin/student-360" },
      { label: "Reports", description: "Attendance exports", href: "/reports/attendance-trend" }
    ],
    modules: [
      {
        key: "daily-registers",
        label: "Daily registers",
        description: "Submitted class register headers, locking state, and completion notes.",
        table: "attendance_registers",
        fields: [
          { key: "attendance_date", label: "Date" },
          { key: "classroom_id", label: "Class" },
          { key: "status", label: "Status" },
          { key: "submitted_at", label: "Submitted" }
        ],
        searchFields: ["status", "classroom_id", "submitted_by", "notes"]
      },
      {
        key: "student-records",
        label: "Student records",
        description: "Student-level present, absent, late, and excused records.",
        table: "attendance_records",
        fields: [
          { key: "attendance_date", label: "Date" },
          { key: "student_id", label: "Student" },
          { key: "classroom_id", label: "Class" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["status", "student_id", "classroom_id", "notes"]
      },
      {
        key: "follow-up",
        label: "Follow-up tasks",
        description: "Attendance automation tasks for unmarked registers, absences, and parent follow-up.",
        table: "workflow_tasks",
        filter: { key: "workflow_key", value: "attendance_follow_up" },
        fields: [
          { key: "task_number", label: "Task" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["task_number", "title", "priority", "status"]
      }
    ]
  },
  {
    key: "assessment",
    title: "Assessment",
    description: "Exam setup, continuous assessment items, imports, moderation, report cards, and grading policy.",
    roles: [],
    quickActions: [
      { label: "Create exam", description: "Set up an assessment item", href: "/teacher/grades#create-grade-item" },
      { label: "Import scores", description: "Upload class template", href: "/teacher/grades#import-grades" },
      { label: "Report cards", description: "Generate reports", href: "/admin/reports" },
      { label: "Grading settings", description: "Edit grade scale", href: "/admin/settings" }
    ],
    modules: [
      {
        key: "assessment-items",
        label: "Assessment items",
        description: "Class score, quizzes, midterm, end-of-term exams, and weighted grade items.",
        table: "grade_items",
        fields: [
          { key: "title", label: "Assessment" },
          { key: "category", label: "Category" },
          { key: "max_score", label: "Max" },
          { key: "weight", label: "Weight" }
        ],
        searchFields: ["title", "category"]
      },
      {
        key: "grade-imports",
        label: "Grade imports",
        description: "Teacher-uploaded class templates with validation, extraction, and publication state.",
        table: "grade_import_batches",
        fields: [
          { key: "title", label: "Import" },
          { key: "classroom_id", label: "Class" },
          { key: "subject_id", label: "Subject" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["title", "classroom_id", "subject_id", "term", "status", "notes"]
      },
      {
        key: "marks-register",
        label: "Marks register",
        description: "Student scores, comments, grading teacher, and published result data.",
        table: "grades",
        fields: [
          { key: "grade_item_id", label: "Assessment" },
          { key: "student_id", label: "Student" },
          { key: "score", label: "Score" },
          { key: "comments", label: "Comments" }
        ],
        searchFields: ["grade_item_id", "student_id", "score", "comments"]
      },
      {
        key: "report-cards",
        label: "Report cards",
        description: "Generated end-of-term reports with analysis, rankings, publication, and download links.",
        table: "reports",
        fields: [
          { key: "report_number", label: "Report" },
          { key: "title", label: "Title" },
          { key: "term", label: "Term" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["report_number", "title", "term", "status", "summary"]
      }
    ]
  },
  {
    key: "admissions-office",
    title: "Admissions",
    description: "Admission applications, inquiry tracking, decisions, parent onboarding, and accepted-student handoff.",
    roles: [],
    quickActions: [
      { label: "Review decisions", description: "Accept or deny applicants", href: "/admin/admissions" },
      { label: "Public form", description: "Open application page", href: "/admissions" },
      { label: "Add inquiry", description: "Record front desk lead", href: "/front-office/walk-in-enquiries" },
      { label: "Create parent access", description: "Invite guardian account", href: "/admin/access" }
    ],
    modules: [
      {
        key: "applications",
        label: "Applications",
        description: "Submitted admission forms with guardian data, applied class, decision status, and notes.",
        table: "admission_applications",
        fields: [
          { key: "applicant_first_name", label: "First name" },
          { key: "applicant_last_name", label: "Last name" },
          { key: "applying_grade", label: "Class" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["applicant_first_name", "applicant_last_name", "applying_grade", "guardian_email", "guardian_phone", "status", "notes"]
      },
      {
        key: "inquiries",
        label: "Inquiries",
        description: "Walk-in, phone, referral, social, and website admission leads.",
        table: "front_office_enquiries",
        fields: [
          { key: "enquiry_number", label: "Enquiry" },
          { key: "full_name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["enquiry_number", "full_name", "phone", "email", "interest_area", "status", "notes"]
      },
      {
        key: "onboarding-tasks",
        label: "Onboarding tasks",
        description: "Accepted-applicant automation tasks for parent account, billing, class placement, and ID setup.",
        table: "workflow_tasks",
        filter: { key: "workflow_key", value: "admissions_onboarding" },
        fields: [
          { key: "task_number", label: "Task" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["task_number", "title", "priority", "status"]
      }
    ]
  },
  {
    key: "messages",
    title: "Communication Hub",
    description: "Notices, announcements, SMS/email delivery, conversation threads, and guardian communication.",
    roles: ["it_support"],
    quickActions: [
      { label: "Announcement", description: "Broadcast to roles", href: "/communication/announcements" },
      { label: "Email queue", description: "Review delivery", href: "/communication/email-queue" },
      { label: "SMS queue", description: "Review credits and sends", href: "/communication/sms-queue" },
      { label: "Parent messages", description: "Open guardian inbox", href: "/parent/messages" }
    ],
    modules: [
      {
        key: "announcements",
        label: "Announcements",
        description: "Published notices targeted to classes, roles, parents, students, staff, or all users.",
        table: "announcements",
        fields: [
          { key: "title", label: "Notice" },
          { key: "priority", label: "Priority" },
          { key: "audience_roles", label: "Audience" },
          { key: "starts_at", label: "Starts" }
        ],
        searchFields: ["title", "body", "priority", "audience_roles"]
      },
      {
        key: "campaigns",
        label: "Campaigns",
        description: "Email, SMS, push, in-app, and multi-channel campaign planning.",
        table: "communication_campaigns",
        fields: [
          { key: "name", label: "Campaign" },
          { key: "subject", label: "Subject" },
          { key: "channel", label: "Channel" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["name", "subject", "channel", "status", "body", "audience_roles"]
      },
      {
        key: "email",
        label: "Email",
        description: "Queued and delivered email notifications.",
        table: "email_outbox",
        fields: [
          { key: "recipient_email", label: "Recipient" },
          { key: "subject", label: "Subject" },
          { key: "status", label: "Status" },
          { key: "attempts", label: "Attempts" }
        ],
        searchFields: ["recipient_email", "subject", "status", "last_error"]
      },
      {
        key: "sms",
        label: "SMS",
        description: "Queued and delivered SMS notifications.",
        table: "sms_outbox",
        fields: [
          { key: "recipient_phone", label: "Phone" },
          { key: "body", label: "Message" },
          { key: "status", label: "Status" },
          { key: "attempts", label: "Attempts" }
        ],
        searchFields: ["recipient_phone", "body", "status", "last_error"]
      },
      {
        key: "threads",
        label: "Messages",
        description: "Parent, teacher, and staff conversation threads.",
        table: "conversations",
        fields: [
          { key: "title", label: "Thread" },
          { key: "created_by", label: "Created by" },
          { key: "created_at", label: "Created" }
        ],
        searchFields: ["title"]
      }
    ]
  },
  {
    key: "calendar",
    title: "School Calendar",
    description: "Academic years, terms, public events, examination windows, holidays, and school-day planning.",
    roles: [],
    quickActions: [
      { label: "Add event", description: "Publish calendar item", href: "/events" },
      { label: "Exam windows", description: "Manage assessment dates", href: "/exams/exam-windows" },
      { label: "Public calendar", description: "View website events", href: "/events" },
      { label: "Export", description: "Download events", href: "/calendar/events" }
    ],
    modules: [
      {
        key: "events",
        label: "Events",
        description: "School events visible to role dashboards and the public website.",
        table: "events",
        fields: [
          { key: "title", label: "Event" },
          { key: "location", label: "Location" },
          { key: "starts_at", label: "Starts" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["title", "description", "location", "status"]
      },
      {
        key: "academic-years",
        label: "Academic years",
        description: "Academic calendar structure and current-year state.",
        table: "academic_years",
        fields: [
          { key: "name", label: "Year" },
          { key: "starts_on", label: "Starts" },
          { key: "ends_on", label: "Ends" },
          { key: "is_current", label: "Current" }
        ],
        searchFields: ["name"]
      },
      {
        key: "exam-windows",
        label: "Exam windows",
        description: "Term exam periods and publication status.",
        table: "exam_windows",
        fields: [
          { key: "title", label: "Window" },
          { key: "term", label: "Term" },
          { key: "starts_on", label: "Starts" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["title", "term", "status", "notes"]
      }
    ]
  },
  {
    key: "reports",
    title: "Reports",
    description: "Whole-school report centre for attendance, finance, academics, operations, and student report cards.",
    roles: [],
    quickActions: [
      { label: "Generate report", description: "Create report card", href: "/admin/reports" },
      { label: "Assessment", description: "Review marks", href: "/assessment" },
      { label: "Attendance trend", description: "Open attendance reports", href: "/attendance" },
      { label: "Finance", description: "Open finance reports", href: "/finance" }
    ],
    modules: [
      {
        key: "report-cards",
        label: "Report cards",
        description: "Generated student report cards, analysis, rankings, status, and download links.",
        table: "reports",
        fields: [
          { key: "report_number", label: "Report" },
          { key: "title", label: "Title" },
          { key: "term", label: "Term" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["report_number", "title", "term", "status", "summary"]
      },
      {
        key: "attendance-trend",
        label: "Attendance trend",
        description: "Recent attendance records for operational and learner-risk reporting.",
        table: "attendance_records",
        fields: [
          { key: "attendance_date", label: "Date" },
          { key: "student_id", label: "Student" },
          { key: "classroom_id", label: "Class" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["status", "student_id", "classroom_id", "notes"]
      },
      {
        key: "fee-collection",
        label: "Fee collection",
        description: "Daily fee payments and cashier collection visibility.",
        table: "daily_fee_payments",
        fields: [
          { key: "student_number", label: "Student ID" },
          { key: "payment_date", label: "Date" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["student_number", "receipt_number", "payer_name", "status", "payment_method"]
      },
      {
        key: "workflow-audit",
        label: "Workflow audit",
        description: "Open, completed, and blocked automation tasks across the platform.",
        table: "workflow_tasks",
        fields: [
          { key: "task_number", label: "Task" },
          { key: "workflow_key", label: "Workflow" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["task_number", "workflow_key", "title", "priority", "status"]
      }
    ]
  },
  {
    key: "front-office",
    title: "Front Office Workspace",
    description: "Reception, walk-in enquiries, visitors, parent complaints, admission touchpoints, and event desk activity.",
    roles: ["hr_staff"],
    modules: [
      {
        key: "walk-in-enquiries",
        label: "Walk-in enquiries",
        description: "Reception leads from calls, walk-ins, referrals, and admission conversations.",
        table: "front_office_enquiries",
        fields: [
          { key: "enquiry_number", label: "Enquiry" },
          { key: "full_name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "interest_area", label: "Interest" },
          { key: "status", label: "Status" },
          { key: "priority", label: "Priority" }
        ],
        searchFields: ["enquiry_number", "full_name", "phone", "email", "interest_area", "status", "notes"],
        createFields: [
          { key: "full_name", label: "Parent or visitor name", required: true },
          { key: "phone", label: "Phone", type: "tel", required: true },
          { key: "email", label: "Email", type: "email" },
          {
            key: "source",
            label: "Source",
            type: "select",
            options: [
              { label: "Walk-in", value: "walk_in" },
              { label: "Phone", value: "phone" },
              { label: "Website", value: "website" },
              { label: "Referral", value: "referral" },
              { label: "Social media", value: "social_media" },
              { label: "Other", value: "other" }
            ]
          },
          { key: "interest_area", label: "Interest area", placeholder: "Admissions, transport, fees, recruitment..." },
          { key: "priority", label: "Priority", type: "select", options: priorityOptions },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "New", value: "new" },
              { label: "Contacted", value: "contacted" },
              { label: "Tour booked", value: "tour_booked" },
              { label: "Converted", value: "converted" },
              { label: "Closed", value: "closed" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "website-inquiries",
        label: "Website inquiries",
        description: "Contact form messages that need reception follow-up.",
        table: "contact_inquiries",
        fields: [
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "subject", label: "Subject" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["full_name", "email", "phone", "subject", "message", "status"],
        createFields: [
          { key: "full_name", label: "Full name", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "subject", label: "Subject" },
          { key: "message", label: "Message", type: "textarea", required: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "New", value: "new" },
              { label: "Open", value: "open" },
              { label: "Closed", value: "closed" }
            ]
          }
        ]
      },
      {
        key: "visitors",
        label: "Visitor book",
        description: "Gate and reception visitor sign-in records.",
        table: "visitor_logs",
        fields: [
          { key: "visitor_name", label: "Visitor" },
          { key: "phone", label: "Phone" },
          { key: "purpose", label: "Purpose" },
          { key: "person_to_see", label: "Person to see" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["visitor_name", "phone", "organization", "purpose", "person_to_see", "badge_number", "status"],
        createFields: [
          { key: "visitor_name", label: "Visitor name", required: true },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "organization", label: "Organization" },
          { key: "purpose", label: "Purpose", required: true },
          { key: "person_to_see", label: "Person to see" },
          { key: "badge_number", label: "Badge number" },
          { key: "checked_in_at", label: "Checked in", type: "datetime" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Expected", value: "expected" },
              { label: "Checked in", value: "checked_in" },
              { label: "Checked out", value: "checked_out" },
              { label: "Flagged", value: "flagged" }
            ]
          }
        ]
      },
      {
        key: "complaints",
        label: "Parent complaints",
        description: "Parent concerns, escalation notes, and closure tracking.",
        table: "parent_complaints",
        fields: [
          { key: "complaint_number", label: "Case" },
          { key: "guardian_name", label: "Guardian" },
          { key: "title", label: "Issue" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["complaint_number", "guardian_name", "guardian_phone", "category", "title", "description", "status", "priority"],
        createFields: [
          { key: "guardian_name", label: "Guardian name" },
          { key: "guardian_phone", label: "Guardian phone", type: "tel" },
          { key: "category", label: "Category", required: true, placeholder: "Fees, transport, academics, conduct..." },
          { key: "title", label: "Issue title", required: true },
          { key: "priority", label: "Priority", type: "select", options: priorityOptions },
          { key: "description", label: "Description", type: "textarea", required: true }
        ]
      },
      {
        key: "events",
        label: "Event desk",
        description: "Published school events visible to the public and role dashboards.",
        table: "events",
        fields: [
          { key: "title", label: "Event" },
          { key: "location", label: "Location" },
          { key: "starts_at", label: "Starts" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["title", "description", "location", "status"]
      }
    ]
  },
  {
    key: "id-cards",
    title: "ID Cards Workspace",
    description: "Student and staff card issuing, QR verification, print readiness, and card risk checks.",
    roles: ["finance_officer", "it_support", "teacher", "hr_staff"],
    modules: [
      {
        key: "student-cards",
        label: "Student cards",
        description: "QR cards used for daily fee collection and attendance scans.",
        table: "student_id_cards",
        fields: [
          { key: "card_number", label: "Card" },
          { key: "student_number", label: "Student ID" },
          { key: "status", label: "Status" },
          { key: "issued_at", label: "Issued" },
          { key: "expires_on", label: "Expires" }
        ],
        searchFields: ["card_number", "student_number", "qr_payload", "status"]
      },
      {
        key: "staff-cards",
        label: "Staff cards",
        description: "Staff ID card records for school access and verification.",
        table: "staff_id_cards",
        fields: [
          { key: "card_number", label: "Card" },
          { key: "staff_number", label: "Staff ID" },
          { key: "status", label: "Status" },
          { key: "issued_at", label: "Issued" },
          { key: "expires_on", label: "Expires" }
        ],
        searchFields: ["card_number", "staff_number", "qr_payload", "status"],
        createFields: [
          { key: "staff_number", label: "Staff number", required: true },
          { key: "qr_payload", label: "QR payload", required: true, placeholder: "CIS-STAFF:STF-2026-001" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Expired", value: "expired" },
              { label: "Revoked", value: "revoked" },
              { label: "Lost", value: "lost" },
              { label: "Retired", value: "retired" }
            ]
          },
          { key: "expires_on", label: "Expires on", type: "date" }
        ]
      },
      {
        key: "verifications",
        label: "Verification log",
        description: "QR code checks from attendance, finance, and front-desk verification.",
        table: "id_card_verifications",
        fields: [
          { key: "card_code", label: "Card code" },
          { key: "card_type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "verified_at", label: "Verified" },
          { key: "notes", label: "Notes" }
        ],
        searchFields: ["card_code", "card_type", "status", "notes"],
        createFields: [
          { key: "card_code", label: "Card code or QR payload", required: true },
          {
            key: "card_type",
            label: "Card type",
            type: "select",
            options: [
              { label: "Student", value: "student" },
              { label: "Staff", value: "staff" },
              { label: "Unknown", value: "unknown" }
            ]
          },
          {
            key: "status",
            label: "Verification result",
            type: "select",
            options: [
              { label: "Valid", value: "valid" },
              { label: "Expired", value: "expired" },
              { label: "Revoked", value: "revoked" },
              { label: "Missing", value: "missing" },
              { label: "Unknown", value: "unknown" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      }
    ]
  },
  {
    key: "preschool",
    title: "Preschool Workspace",
    description: "Daily child-care logs, observations, pickups, incidents, portfolios, and parent report readiness.",
    roles: ["teacher", "hr_staff"],
    modules: [
      {
        key: "daily-logs",
        label: "Daily logs",
        description: "Meal, nap, mood, toileting, pickup, and parent-report logs.",
        table: "preschool_daily_logs",
        fields: [
          { key: "log_date", label: "Date" },
          { key: "student_number", label: "Student ID" },
          { key: "meal_status", label: "Meal" },
          { key: "nap_status", label: "Nap" },
          { key: "report_sent", label: "Sent" }
        ],
        searchFields: ["student_number", "meal_status", "nap_status", "mood", "teacher_notes"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "log_date", label: "Log date", type: "date" },
          { key: "arrival_time", label: "Arrival time", type: "time" },
          { key: "pickup_time", label: "Pickup time", type: "time" },
          {
            key: "meal_status",
            label: "Meal status",
            type: "select",
            options: [
              { label: "Not recorded", value: "not_recorded" },
              { label: "Ate well", value: "ate_well" },
              { label: "Ate some", value: "ate_some" },
              { label: "Did not eat", value: "did_not_eat" }
            ]
          },
          {
            key: "nap_status",
            label: "Nap status",
            type: "select",
            options: [
              { label: "Not recorded", value: "not_recorded" },
              { label: "Slept well", value: "slept_well" },
              { label: "Short rest", value: "short_rest" },
              { label: "No sleep", value: "no_sleep" }
            ]
          },
          {
            key: "mood",
            label: "Mood",
            type: "select",
            options: [
              { label: "Settled", value: "settled" },
              { label: "Happy", value: "happy" },
              { label: "Tired", value: "tired" },
              { label: "Upset", value: "upset" },
              { label: "Unwell", value: "unwell" },
              { label: "Not recorded", value: "not_recorded" }
            ]
          },
          { key: "toileting", label: "Toileting" },
          { key: "report_sent", label: "Report sent", type: "checkbox" },
          { key: "teacher_notes", label: "Teacher notes", type: "textarea" }
        ]
      },
      {
        key: "observations",
        label: "Observations",
        description: "Learning stories and developmental evidence shared with parents.",
        table: "preschool_observations",
        fields: [
          { key: "observation_date", label: "Date" },
          { key: "student_number", label: "Student ID" },
          { key: "domain", label: "Domain" },
          { key: "title", label: "Observation" },
          { key: "shared_with_parent", label: "Shared" }
        ],
        searchFields: ["student_number", "domain", "title", "observation", "next_steps"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "observation_date", label: "Date", type: "date" },
          {
            key: "domain",
            label: "Learning domain",
            type: "select",
            options: [
              { label: "Literacy", value: "literacy" },
              { label: "Numeracy", value: "numeracy" },
              { label: "Creative arts", value: "creative_arts" },
              { label: "Social emotional", value: "social_emotional" },
              { label: "Motor skills", value: "motor" },
              { label: "Self care", value: "self_care" },
              { label: "Other", value: "other" }
            ]
          },
          { key: "title", label: "Title", required: true },
          { key: "observation", label: "Observation", type: "textarea", required: true },
          { key: "next_steps", label: "Next steps", type: "textarea" },
          { key: "shared_with_parent", label: "Shared with parent", type: "checkbox" }
        ]
      },
      {
        key: "pickups",
        label: "Pickups",
        description: "Late pickup, guardian handover, and blocked-release tracking.",
        table: "preschool_pickups",
        fields: [
          { key: "pickup_time", label: "Pickup" },
          { key: "student_number", label: "Student ID" },
          { key: "guardian_name", label: "Guardian" },
          { key: "verification_method", label: "Verified by" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["student_number", "guardian_name", "relationship", "verification_method", "status", "notes"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "guardian_name", label: "Guardian name", required: true },
          { key: "relationship", label: "Relationship" },
          { key: "pickup_time", label: "Pickup time", type: "datetime" },
          {
            key: "verification_method",
            label: "Verification method",
            type: "select",
            options: [
              { label: "ID card", value: "id_card" },
              { label: "Known guardian", value: "known_guardian" },
              { label: "Phone confirmed", value: "phone_confirmed" },
              { label: "Staff confirmed", value: "staff_confirmed" },
              { label: "Other", value: "other" }
            ]
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Expected", value: "expected" },
              { label: "Picked up", value: "picked_up" },
              { label: "Late", value: "late" },
              { label: "Blocked", value: "blocked" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "incidents",
        label: "Incidents",
        description: "Preschool health, safety, safeguarding, and behaviour incidents.",
        table: "preschool_incidents",
        fields: [
          { key: "incident_number", label: "Incident" },
          { key: "student_number", label: "Student ID" },
          { key: "category", label: "Category" },
          { key: "severity", label: "Severity" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["incident_number", "student_number", "category", "severity", "summary", "action_taken", "status"],
        createFields: [
          { key: "student_number", label: "Student number" },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Health", value: "health" },
              { label: "Safety", value: "safety" },
              { label: "Behaviour", value: "behaviour" },
              { label: "Safeguarding", value: "safeguarding" },
              { label: "Other", value: "other" }
            ]
          },
          {
            key: "severity",
            label: "Severity",
            type: "select",
            options: [
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Critical", value: "critical" }
            ]
          },
          { key: "occurred_at", label: "Occurred at", type: "datetime" },
          { key: "summary", label: "Summary", type: "textarea", required: true },
          { key: "action_taken", label: "Action taken", type: "textarea" },
          { key: "parent_notified", label: "Parent notified", type: "checkbox" }
        ]
      }
    ]
  },
  {
    key: "academics-office",
    title: "Academic Planning Workspace",
    description: "Schemes of work, curriculum units, lesson plans, study material, timetable records, and teaching readiness.",
    roles: ["teacher"],
    modules: [
      {
        key: "schemes",
        label: "Schemes of work",
        description: "Class/subject term plans arranged by week, topic, objectives, and resources.",
        table: "class_subject_schemes",
        fields: [
          { key: "grade_level", label: "Class level" },
          { key: "subject_name", label: "Subject" },
          { key: "term", label: "Term" },
          { key: "week_number", label: "Week" },
          { key: "topic", label: "Topic" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["grade_level", "subject_name", "term", "topic", "objectives", "resources", "status"],
        createFields: [
          { key: "grade_level", label: "Class level", required: true, placeholder: "Primary 4, KG 2, JHS 1..." },
          { key: "subject_name", label: "Subject", required: true },
          { key: "term", label: "Term", type: "select", options: [{ label: "Term 1", value: "Term 1" }, { label: "Term 2", value: "Term 2" }, { label: "Term 3", value: "Term 3" }] },
          { key: "week_number", label: "Week", type: "number", required: true },
          { key: "topic", label: "Topic", required: true },
          { key: "objectives", label: "Objectives", type: "textarea" },
          { key: "resources", label: "Resources", type: "textarea" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Planned", value: "planned" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Archived", value: "archived" }
            ]
          }
        ]
      },
      {
        key: "curriculum-units",
        label: "Curriculum units",
        description: "Learning outcomes and resources for class subjects.",
        table: "curriculum_units",
        fields: [
          { key: "grade_level", label: "Class level" },
          { key: "title", label: "Unit" },
          { key: "sequence", label: "Sequence" },
          { key: "learning_outcomes", label: "Outcomes" }
        ],
        searchFields: ["grade_level", "title", "description", "learning_outcomes"],
        createFields: [
          { key: "grade_level", label: "Class level", required: true },
          { key: "title", label: "Unit title", required: true },
          { key: "sequence", label: "Sequence", type: "number" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "learning_outcomes", label: "Learning outcomes", type: "tags", placeholder: "Separate outcomes with commas" }
        ]
      },
      { key: "lesson-plans", label: "Lesson plans", description: "Teacher lesson plans connected to courses and curriculum units.", table: "lesson_plans", fields: [{ key: "title", label: "Lesson" }, { key: "planned_for", label: "Date" }, { key: "status", label: "Status" }, { key: "homework", label: "Homework" }], searchFields: ["title", "activities", "homework", "status"] },
      { key: "study-materials", label: "Study materials", description: "Resources shared with learners for assignments, revision, and projects.", table: "course_materials", fields: [{ key: "title", label: "Material" }, { key: "description", label: "Description" }, { key: "visible_from", label: "Visible from" }], searchFields: ["title", "description", "url"] },
      { key: "timetable", label: "Timetable", description: "Class periods, subject timing, rooms, and teacher scheduling checks.", table: "timetables", fields: [{ key: "day_of_week", label: "Day" }, { key: "starts_at", label: "Starts" }, { key: "ends_at", label: "Ends" }, { key: "room_number", label: "Room" }], searchFields: ["room_number"] }
    ]
  },
  {
    key: "exams",
    title: "Examinations Workspace",
    description: "Exam windows, course exam sessions, grading items, report publication, and timetable readiness.",
    roles: ["teacher"],
    modules: [
      {
        key: "exam-windows",
        label: "Exam windows",
        description: "Term examination periods visible to staff, students, and parents when published.",
        table: "exam_windows",
        fields: [
          { key: "title", label: "Window" },
          { key: "term", label: "Term" },
          { key: "starts_on", label: "Starts" },
          { key: "ends_on", label: "Ends" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["title", "term", "status", "notes"],
        createFields: [
          { key: "title", label: "Window title", required: true, placeholder: "End of Term 1 Examination" },
          { key: "term", label: "Term", type: "select", options: [{ label: "Term 1", value: "Term 1" }, { label: "Term 2", value: "Term 2" }, { label: "Term 3", value: "Term 3" }] },
          { key: "starts_on", label: "Starts", type: "date", required: true },
          { key: "ends_on", label: "Ends", type: "date", required: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
              { label: "Completed", value: "completed" },
              { label: "Archived", value: "archived" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "exam-sessions",
        label: "Exam sessions",
        description: "Subject-level exam sessions, locations, and invigilation notes.",
        table: "exam_sessions",
        fields: [
          { key: "title", label: "Session" },
          { key: "starts_at", label: "Starts" },
          { key: "ends_at", label: "Ends" },
          { key: "location", label: "Location" }
        ],
        searchFields: ["title", "location"],
        createFields: [
          { key: "title", label: "Exam title", required: true },
          { key: "starts_at", label: "Starts", type: "datetime", required: true },
          { key: "ends_at", label: "Ends", type: "datetime" },
          { key: "location", label: "Location" }
        ]
      },
      { key: "grade-items", label: "Assessment items", description: "Continuous assessment, class tests, exams, and report-card grade items.", table: "grade_items", fields: [{ key: "title", label: "Assessment" }, { key: "category", label: "Category" }, { key: "max_score", label: "Max" }, { key: "weight", label: "Weight" }], searchFields: ["title", "category"] },
      { key: "reports", label: "Published reports", description: "Generated academic reports and end-of-term publication status.", table: "reports", fields: [{ key: "report_number", label: "Report" }, { key: "title", label: "Title" }, { key: "term", label: "Term" }, { key: "status", label: "Status" }], searchFields: ["report_number", "title", "term", "status"] }
    ]
  },
  {
    key: "learner-care",
    title: "Learner Care Workspace",
    description: "Behaviour, wellbeing, safeguarding, health notes, interventions, and Student 360 follow-up cases.",
    roles: ["teacher", "hr_staff"],
    modules: [
      {
        key: "wellbeing-cases",
        label: "Wellbeing cases",
        description: "Learner support cases with risk, action plan, and closure status.",
        table: "learner_wellbeing_cases",
        fields: [
          { key: "case_number", label: "Case" },
          { key: "learner_name", label: "Learner" },
          { key: "category", label: "Category" },
          { key: "risk_level", label: "Risk" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["case_number", "learner_name", "category", "risk_level", "status", "summary", "action_plan"],
        createFields: [
          { key: "learner_name", label: "Learner name" },
          {
            key: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Wellbeing", value: "wellbeing" },
              { label: "Discipline", value: "discipline" },
              { label: "Safeguarding", value: "safeguarding" },
              { label: "Health", value: "health" },
              { label: "Counselling", value: "counselling" }
            ]
          },
          {
            key: "risk_level",
            label: "Risk level",
            type: "select",
            options: [
              { label: "Green", value: "green" },
              { label: "Amber", value: "amber" },
              { label: "Red", value: "red" }
            ]
          },
          { key: "summary", label: "Summary", type: "textarea", required: true },
          { key: "action_plan", label: "Action plan", type: "textarea" }
        ]
      },
      { key: "behaviour", label: "Behaviour records", description: "Positive, disciplinary, wellbeing, and safeguarding entries connected to students.", table: "student_behavior_records", fields: [{ key: "incident_date", label: "Date" }, { key: "category", label: "Category" }, { key: "title", label: "Title" }, { key: "visibility", label: "Visibility" }], searchFields: ["category", "title", "description", "action_taken", "visibility"] },
      { key: "medical", label: "Medical notes", description: "Learner medical records and health-sensitive follow-up data.", table: "student_medical_records", fields: [{ key: "condition_name", label: "Condition" }, { key: "severity", label: "Severity" }, { key: "reviewed_at", label: "Reviewed" }], searchFields: ["condition_name", "severity", "notes"] },
      { key: "student-360-notes", label: "Student 360 notes", description: "Academic, attendance, finance, wellbeing, and parent-contact notes.", table: "student_360_notes", fields: [{ key: "note_type", label: "Type" }, { key: "title", label: "Title" }, { key: "visibility", label: "Visibility" }], searchFields: ["note_type", "title", "body", "visibility"] }
    ]
  },
  {
    key: "platform-audit",
    title: "Platform Audit Workspace",
    description: "A beta-readiness command centre for approvals, automation queues, integrations, delivery logs, access invitations, and protected data changes.",
    roles: ["it_support"],
    quickActions: [
      { label: "Automation", description: "Run operational checks", href: "/admin/automation" },
      { label: "User access", description: "Review accounts and invitations", href: "/admin/access" },
      { label: "Finance approvals", description: "Review billing controls", href: "/finance/collections" },
      { label: "Settings", description: "Open platform controls", href: "/admin/settings" }
    ],
    modules: [
      {
        key: "work-queue",
        label: "Work queue",
        description: "Open, blocked, urgent, and completed workflow tasks generated by admissions, finance, attendance, HR, IT, and learner care.",
        table: "workflow_tasks",
        fields: [
          { key: "task_number", label: "Task" },
          { key: "workflow_key", label: "Workflow" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "due_at", label: "Due" }
        ],
        searchFields: ["task_number", "workflow_key", "title", "priority", "status"]
      },
      {
        key: "protected-changes",
        label: "Protected changes",
        description: "Audit trail of sensitive inserts, updates, and deletes across protected school records.",
        table: "audit_logs",
        softDelete: false,
        fields: [
          { key: "action", label: "Action" },
          { key: "table_name", label: "Table" },
          { key: "record_id", label: "Record" },
          { key: "created_at", label: "Created" }
        ],
        searchFields: ["action", "table_name", "record_id"]
      },
      {
        key: "integrations",
        label: "Integration events",
        description: "External service events, processing outcomes, and errors from email, SMS, QR, import, and automation flows.",
        table: "integration_events",
        fields: [
          { key: "source", label: "Source" },
          { key: "event_type", label: "Event" },
          { key: "external_id", label: "External ID" },
          { key: "processed_at", label: "Processed" },
          { key: "error", label: "Error" }
        ],
        searchFields: ["source", "event_type", "external_id", "error"]
      },
      {
        key: "access-invitations",
        label: "Access invitations",
        description: "Parent, student, staff, and administrator invitation status for onboarding and account recovery.",
        table: "portal_invitations",
        fields: [
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "delivery", label: "Delivery" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Created" }
        ],
        searchFields: ["email", "role", "delivery", "status", "reason"]
      },
      {
        key: "email-delivery",
        label: "Email delivery",
        description: "Queued, sent, failed, and retried Crestview-branded emails.",
        table: "email_outbox",
        fields: [
          { key: "recipient_email", label: "Recipient" },
          { key: "subject", label: "Subject" },
          { key: "status", label: "Status" },
          { key: "attempts", label: "Attempts" },
          { key: "scheduled_for", label: "Scheduled" }
        ],
        searchFields: ["recipient_email", "subject", "status", "last_error"]
      },
      {
        key: "sms-delivery",
        label: "SMS delivery",
        description: "Queued, sent, failed, and retried SMS notices for guardians and staff.",
        table: "sms_outbox",
        fields: [
          { key: "recipient_phone", label: "Phone" },
          { key: "body", label: "Message" },
          { key: "status", label: "Status" },
          { key: "attempts", label: "Attempts" },
          { key: "scheduled_for", label: "Scheduled" }
        ],
        searchFields: ["recipient_phone", "body", "status", "last_error"]
      },
      {
        key: "report-publication",
        label: "Report publication",
        description: "Generated report cards, rankings, analytics summaries, and publication status before parents or students see them.",
        table: "reports",
        fields: [
          { key: "report_number", label: "Report" },
          { key: "student_id", label: "Student" },
          { key: "term", label: "Term" },
          { key: "status", label: "Status" },
          { key: "published_at", label: "Published" }
        ],
        searchFields: ["report_number", "title", "term", "status", "summary"]
      },
      {
        key: "campaigns",
        label: "Communication campaigns",
        description: "Role-targeted announcements and multi-channel campaigns that keep school communication traceable.",
        table: "communication_campaigns",
        fields: [
          { key: "name", label: "Campaign" },
          { key: "subject", label: "Subject" },
          { key: "channel", label: "Channel" },
          { key: "status", label: "Status" },
          { key: "scheduled_for", label: "Scheduled" }
        ],
        searchFields: ["name", "subject", "channel", "status", "body", "audience_roles"]
      }
    ]
  },
  {
    key: "communication",
    title: "Communication Workspace",
    description: "Notice board, announcements, role-targeted campaigns, email/SMS queues, and guardian communication tracking.",
    roles: ["it_support"],
    modules: [
      {
        key: "announcements",
        label: "Notice board",
        description: "Role-targeted notices shown across dashboards.",
        table: "announcements",
        fields: [
          { key: "title", label: "Notice" },
          { key: "priority", label: "Priority" },
          { key: "audience_roles", label: "Audience" },
          { key: "starts_at", label: "Starts" },
          { key: "ends_at", label: "Ends" }
        ],
        searchFields: ["title", "body", "priority", "audience_roles"],
        createFields: [
          { key: "title", label: "Notice title", required: true },
          { key: "body", label: "Notice body", type: "textarea", required: true },
          { key: "priority", label: "Priority", type: "select", options: priorityOptions },
          { key: "audience_roles", label: "Audience roles", type: "tags", placeholder: audienceRoleHint },
          { key: "starts_at", label: "Starts", type: "datetime" },
          { key: "ends_at", label: "Ends", type: "datetime" }
        ]
      },
      {
        key: "campaigns",
        label: "Campaigns",
        description: "Email, SMS, push, and in-app campaign planning.",
        table: "communication_campaigns",
        fields: [
          { key: "name", label: "Campaign" },
          { key: "subject", label: "Subject" },
          { key: "channel", label: "Channel" },
          { key: "status", label: "Status" },
          { key: "scheduled_for", label: "Scheduled" }
        ],
        searchFields: ["name", "subject", "channel", "status", "body", "audience_roles"],
        createFields: [
          { key: "name", label: "Campaign name", required: true },
          { key: "subject", label: "Subject", required: true },
          {
            key: "channel",
            label: "Channel",
            type: "select",
            options: [
              { label: "Email", value: "email" },
              { label: "SMS", value: "sms" },
              { label: "Push", value: "push" },
              { label: "In app", value: "in_app" },
              { label: "Multi-channel", value: "multi" }
            ]
          },
          { key: "audience_roles", label: "Audience roles", type: "tags", placeholder: audienceRoleHint },
          { key: "body", label: "Message", type: "textarea", required: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Sent", value: "sent" },
              { label: "Cancelled", value: "cancelled" }
            ]
          },
          { key: "scheduled_for", label: "Schedule for", type: "datetime" }
        ]
      },
      { key: "email-queue", label: "Email queue", description: "Queued and sent email records.", table: "email_outbox", fields: [{ key: "recipient_email", label: "Recipient" }, { key: "subject", label: "Subject" }, { key: "status", label: "Status" }, { key: "attempts", label: "Attempts" }], searchFields: ["recipient_email", "subject", "status", "last_error"] },
      { key: "sms-queue", label: "SMS queue", description: "Queued and sent SMS records.", table: "sms_outbox", fields: [{ key: "recipient_phone", label: "Phone" }, { key: "body", label: "Message" }, { key: "status", label: "Status" }, { key: "attempts", label: "Attempts" }], searchFields: ["recipient_phone", "body", "status", "last_error"] },
      { key: "messages", label: "Conversations", description: "Parent, teacher, and staff conversation threads.", table: "conversations", fields: [{ key: "title", label: "Conversation" }, { key: "created_by", label: "Created by" }, { key: "created_at", label: "Created" }], searchFields: ["title"] }
    ]
  },
  {
    key: "bursary",
    title: "Bursary Workspace",
    description: "Cashier sessions, receipts, daily collections, and payment reconciliation controls.",
    roles: ["finance_officer"],
    modules: [
      {
        key: "cashier-sessions",
        label: "Cashier sessions",
        description: "Open, close, reconcile, and flag daily cash shifts.",
        table: "cashier_sessions",
        fields: [
          { key: "session_number", label: "Session" },
          { key: "opened_at", label: "Opened" },
          { key: "cash_expected", label: "Expected cash" },
          { key: "cash_counted", label: "Counted cash" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["session_number", "status", "notes"],
        createFields: [
          { key: "opening_float", label: "Opening float", type: "number" },
          { key: "cash_expected", label: "Expected cash", type: "number" },
          { key: "mobile_money_total", label: "Mobile money total", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Open", value: "open" },
              { label: "Closed", value: "closed" },
              { label: "Reconciled", value: "reconciled" },
              { label: "Flagged", value: "flagged" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "receipts",
        label: "Receipts",
        description: "Cash, mobile money, card, bank, and exception receipts.",
        table: "bursary_receipts",
        fields: [
          { key: "receipt_number", label: "Receipt" },
          { key: "student_number", label: "Student ID" },
          { key: "payer_name", label: "Payer" },
          { key: "amount", label: "Amount" },
          { key: "service_type", label: "Service" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["receipt_number", "student_number", "payer_name", "service_type", "reference", "status"],
        createFields: [
          { key: "student_number", label: "Student number" },
          { key: "payer_name", label: "Payer name", required: true },
          { key: "payment_date", label: "Payment date", type: "date" },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "currency", label: "Currency", placeholder: "GHS" },
          { key: "method", label: "Payment method", type: "select", options: paymentMethodOptions },
          {
            key: "service_type",
            label: "Service",
            type: "select",
            options: [
              { label: "Daily fee", value: "daily_fee" },
              { label: "Feeding", value: "feeding" },
              { label: "Extra classes", value: "extra_classes" },
              { label: "Transport", value: "transport" },
              { label: "Invoice", value: "invoice" },
              { label: "Other", value: "other" }
            ]
          },
          { key: "reference", label: "Reference" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "daily-fees",
        label: "Daily fee payments",
        description: "Official student daily-fee records from QR scans and ID lookup.",
        table: "daily_fee_payments",
        fields: [
          { key: "payment_date", label: "Date" },
          { key: "student_number", label: "Student ID" },
          { key: "amount", label: "Amount" },
          { key: "method", label: "Method" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["student_number", "reference", "method", "status", "notes"]
      }
    ]
  },
  {
    key: "accounting",
    title: "Accounting Workspace",
    description: "General ledger setup, chart of accounts, journals, supplier bills, and bank accounts.",
    roles: ["finance_officer"],
    modules: [
      {
        key: "chart-of-accounts",
        label: "Chart of accounts",
        description: "Account codes grouped by asset, liability, equity, revenue, and expense.",
        table: "chart_of_accounts",
        fields: [
          { key: "account_code", label: "Code" },
          { key: "name", label: "Account" },
          { key: "account_type", label: "Type" },
          { key: "is_active", label: "Active" }
        ],
        searchFields: ["account_code", "name", "account_type", "description"],
        createFields: [
          { key: "account_code", label: "Account code", required: true },
          { key: "name", label: "Account name", required: true },
          {
            key: "account_type",
            label: "Type",
            type: "select",
            options: [
              { label: "Asset", value: "asset" },
              { label: "Liability", value: "liability" },
              { label: "Equity", value: "equity" },
              { label: "Revenue", value: "revenue" },
              { label: "Expense", value: "expense" }
            ]
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "is_active", label: "Active", type: "checkbox" }
        ]
      },
      {
        key: "fiscal-years",
        label: "Fiscal years",
        description: "Open, close, and lock accounting periods.",
        table: "fiscal_years",
        fields: [
          { key: "name", label: "Year" },
          { key: "starts_on", label: "Starts" },
          { key: "ends_on", label: "Ends" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["name", "status", "notes"],
        createFields: [
          { key: "name", label: "Fiscal year", required: true, placeholder: "2026/2027" },
          { key: "starts_on", label: "Starts", type: "date", required: true },
          { key: "ends_on", label: "Ends", type: "date", required: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Open", value: "open" },
              { label: "Closed", value: "closed" },
              { label: "Locked", value: "locked" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "journals",
        label: "Journal entries",
        description: "Manual and automated double-entry posting records.",
        table: "journal_entries",
        fields: [
          { key: "entry_number", label: "Entry" },
          { key: "entry_date", label: "Date" },
          { key: "source_module", label: "Source" },
          { key: "memo", label: "Memo" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["entry_number", "memo", "source_module", "status"],
        createFields: [
          { key: "entry_date", label: "Entry date", type: "date" },
          { key: "memo", label: "Memo", required: true },
          { key: "source_module", label: "Source module", placeholder: "daily_fee, payroll, manual..." },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Posted", value: "posted" },
              { label: "Reversed", value: "reversed" }
            ]
          }
        ]
      },
      { key: "journal-lines", label: "Journal lines", description: "Debit and credit lines tied to journal entries.", table: "journal_entry_lines", fields: [{ key: "account_code", label: "Account" }, { key: "description", label: "Description" }, { key: "debit", label: "Debit" }, { key: "credit", label: "Credit" }], searchFields: ["account_code", "description"] },
      {
        key: "supplier-bills",
        label: "Supplier bills",
        description: "Vendor invoices, due dates, approvals, and payment status.",
        table: "supplier_bills",
        fields: [
          { key: "bill_number", label: "Bill" },
          { key: "vendor_name", label: "Vendor" },
          { key: "amount", label: "Amount" },
          { key: "due_date", label: "Due" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["bill_number", "vendor_name", "status", "notes"],
        createFields: [
          { key: "vendor_name", label: "Vendor name", required: true },
          { key: "bill_date", label: "Bill date", type: "date" },
          { key: "due_date", label: "Due date", type: "date" },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "currency", label: "Currency", placeholder: "GHS" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Approved", value: "approved" },
              { label: "Paid", value: "paid" },
              { label: "Overdue", value: "overdue" },
              { label: "Void", value: "void" }
            ]
          },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "bank-accounts",
        label: "Bank accounts",
        description: "School bank and mobile-money accounts used in reconciliation.",
        table: "bank_accounts",
        fields: [
          { key: "account_name", label: "Account" },
          { key: "bank_name", label: "Bank" },
          { key: "account_number", label: "Number" },
          { key: "currency", label: "Currency" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["account_name", "bank_name", "account_number", "status"],
        createFields: [
          { key: "account_name", label: "Account name", required: true },
          { key: "bank_name", label: "Bank or provider", required: true },
          { key: "account_number", label: "Account number" },
          { key: "currency", label: "Currency", placeholder: "GHS" },
          { key: "opening_balance", label: "Opening balance", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Closed", value: "closed" }
            ]
          }
        ]
      }
    ]
  },
  {
    key: "feeding",
    title: "Feeding Workspace",
    description: "Daily feeding enrollment, collection, exemptions, pauses, refunds, and remittance tracking.",
    roles: ["finance_officer", "teacher"],
    modules: [
      { key: "enrollments", label: "Feeding enrollments", description: "Learners enrolled, paused, exempted, or ended for feeding.", table: "student_service_enrollments", filter: { key: "service_type", value: "feeding" }, fields: [{ key: "student_number", label: "Student ID" }, { key: "daily_rate", label: "Daily rate" }, { key: "starts_on", label: "Starts" }, { key: "status", label: "Status" }], searchFields: ["student_number", "status", "notes"] },
      {
        key: "payments",
        label: "Feeding payments",
        description: "Daily feeding cash and mobile money collections.",
        table: "student_service_payments",
        filter: { key: "service_type", value: "feeding" },
        fields: [
          { key: "payment_number", label: "Payment" },
          { key: "payment_date", label: "Date" },
          { key: "student_number", label: "Student ID" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["payment_number", "student_number", "method", "reference", "status", "notes"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "payment_date", label: "Payment date", type: "date" },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "method", label: "Payment method", type: "select", options: paymentMethodOptions },
          { key: "reference", label: "Reference" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "adjustments",
        label: "Feeding adjustments",
        description: "Exemptions, pauses, refunds, remittances, and corrections.",
        table: "student_service_adjustments",
        filter: { key: "service_type", value: "feeding" },
        fields: [
          { key: "adjustment_number", label: "Adjustment" },
          { key: "student_number", label: "Student ID" },
          { key: "adjustment_type", label: "Type" },
          { key: "effective_on", label: "Effective" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["adjustment_number", "student_number", "adjustment_type", "status", "reason"],
        createFields: [
          { key: "student_number", label: "Student number" },
          {
            key: "adjustment_type",
            label: "Adjustment type",
            type: "select",
            options: [
              { label: "Exemption", value: "exemption" },
              { label: "Pause", value: "pause" },
              { label: "Refund", value: "refund" },
              { label: "Remittance", value: "remittance" },
              { label: "Correction", value: "correction" }
            ]
          },
          { key: "amount", label: "Amount", type: "number" },
          { key: "effective_on", label: "Effective on", type: "date" },
          { key: "reason", label: "Reason", type: "textarea", required: true }
        ]
      }
    ]
  },
  {
    key: "extra-classes",
    title: "Extra Classes Workspace",
    description: "Extra class enrollment, daily collection, arrears, exemptions, and reconciliation.",
    roles: ["finance_officer", "teacher"],
    modules: [
      { key: "enrollments", label: "Extra class enrollments", description: "Learners enrolled, paused, exempted, or ended for extra classes.", table: "student_service_enrollments", filter: { key: "service_type", value: "extra_classes" }, fields: [{ key: "student_number", label: "Student ID" }, { key: "daily_rate", label: "Daily rate" }, { key: "starts_on", label: "Starts" }, { key: "status", label: "Status" }], searchFields: ["student_number", "status", "notes"] },
      {
        key: "payments",
        label: "Extra class payments",
        description: "Daily extra class collections and payment confirmation.",
        table: "student_service_payments",
        filter: { key: "service_type", value: "extra_classes" },
        fields: [
          { key: "payment_number", label: "Payment" },
          { key: "payment_date", label: "Date" },
          { key: "student_number", label: "Student ID" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["payment_number", "student_number", "method", "reference", "status", "notes"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "payment_date", label: "Payment date", type: "date" },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "method", label: "Payment method", type: "select", options: paymentMethodOptions },
          { key: "reference", label: "Reference" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      { key: "adjustments", label: "Extra class adjustments", description: "Exemptions, pauses, refunds, remittances, and corrections.", table: "student_service_adjustments", filter: { key: "service_type", value: "extra_classes" }, fields: [{ key: "adjustment_number", label: "Adjustment" }, { key: "student_number", label: "Student ID" }, { key: "adjustment_type", label: "Type" }, { key: "effective_on", label: "Effective" }, { key: "status", label: "Status" }], searchFields: ["adjustment_number", "student_number", "adjustment_type", "status", "reason"] }
    ]
  },
  {
    key: "boarding",
    title: "Boarding Workspace",
    description: "Houses, dormitories, assignments, roll calls, exeats, sick bay notes, visitors, and incidents.",
    roles: ["teacher", "hr_staff", "finance_officer"],
    modules: [
      {
        key: "houses",
        label: "Houses",
        description: "Boarding houses, capacity, status, and house parents.",
        table: "boarding_houses",
        fields: [
          { key: "name", label: "House" },
          { key: "gender", label: "Gender" },
          { key: "capacity", label: "Capacity" },
          { key: "house_parent", label: "House parent" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["name", "gender", "house_parent", "status", "notes"],
        createFields: [
          { key: "name", label: "House name", required: true },
          { key: "gender", label: "Gender", type: "select", options: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Mixed", value: "mixed" }] },
          { key: "capacity", label: "Capacity", type: "number" },
          { key: "house_parent", label: "House parent" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "dormitories",
        label: "Dormitories",
        description: "Dorm capacity, occupancy, and maintenance state.",
        table: "boarding_dormitories",
        fields: [
          { key: "name", label: "Dormitory" },
          { key: "capacity", label: "Capacity" },
          { key: "occupied_count", label: "Occupied" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["name", "status", "notes"],
        createFields: [
          { key: "name", label: "Dormitory name", required: true },
          { key: "capacity", label: "Capacity", type: "number", required: true },
          { key: "occupied_count", label: "Occupied count", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "assignments",
        label: "Assignments",
        description: "Student bed, dormitory, and house assignments.",
        table: "boarding_assignments",
        fields: [
          { key: "student_number", label: "Student ID" },
          { key: "bed_label", label: "Bed" },
          { key: "starts_on", label: "Starts" },
          { key: "ends_on", label: "Ends" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["student_number", "bed_label", "status"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "bed_label", label: "Bed label" },
          { key: "starts_on", label: "Starts on", type: "date" },
          { key: "ends_on", label: "Ends on", type: "date" }
        ]
      },
      {
        key: "roll-call",
        label: "Roll call",
        description: "Boarding roll call by day and time block.",
        table: "boarding_roll_calls",
        fields: [
          { key: "roll_call_date", label: "Date" },
          { key: "roll_call_time", label: "Time" },
          { key: "student_number", label: "Student ID" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["student_number", "roll_call_time", "status", "notes"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "roll_call_date", label: "Date", type: "date" },
          { key: "roll_call_time", label: "Time", type: "select", options: [{ label: "Morning", value: "morning" }, { label: "Afternoon", value: "afternoon" }, { label: "Evening", value: "evening" }, { label: "Night", value: "night" }] },
          { key: "status", label: "Status", type: "select", options: [{ label: "Present", value: "present" }, { label: "Absent", value: "absent" }, { label: "Exeat", value: "exeat" }, { label: "Sick bay", value: "sick_bay" }, { label: "Late", value: "late" }] },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      {
        key: "exeats",
        label: "Exeats",
        description: "Requests, approvals, departures, and returns.",
        table: "boarding_exeats",
        fields: [
          { key: "exeat_number", label: "Exeat" },
          { key: "student_number", label: "Student ID" },
          { key: "destination", label: "Destination" },
          { key: "leaves_at", label: "Leaves" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["exeat_number", "student_number", "destination", "guardian_name", "status", "notes"],
        createFields: [
          { key: "student_number", label: "Student number", required: true },
          { key: "destination", label: "Destination", required: true },
          { key: "guardian_name", label: "Guardian name" },
          { key: "leaves_at", label: "Leaves at", type: "datetime", required: true },
          { key: "returns_at", label: "Returns at", type: "datetime" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      { key: "incidents", label: "Incidents", description: "Boarding discipline, health, safety, maintenance, and other incidents.", table: "boarding_incidents", fields: [{ key: "incident_number", label: "Incident" }, { key: "student_number", label: "Student ID" }, { key: "category", label: "Category" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }], searchFields: ["incident_number", "student_number", "category", "severity", "summary", "action_taken", "status"] },
      { key: "visitors", label: "Visitors", description: "Boarding visitor sign-in, relationships, and handover notes.", table: "boarding_visitors", fields: [{ key: "visit_time", label: "Visit time" }, { key: "visitor_name", label: "Visitor" }, { key: "student_number", label: "Student ID" }, { key: "relationship", label: "Relationship" }, { key: "status", label: "Status" }], searchFields: ["visitor_name", "student_number", "relationship", "status", "notes"] }
    ]
  },
  {
    key: "transport",
    title: "Transport Workspace",
    description: "Routes, stops, vehicles, trips, and student transport assignments.",
    roles: ["finance_officer", "it_support"],
    modules: [
      {
        key: "routes",
        label: "Routes",
        description: "Transport routes and vehicle labels.",
        table: "transport_routes",
        fields: [
          { key: "name", label: "Route" },
          { key: "vehicle_label", label: "Vehicle" },
          { key: "is_active", label: "Active" },
          { key: "description", label: "Description" }
        ],
        searchFields: ["name", "vehicle_label", "description"],
        createFields: [
          { key: "name", label: "Route name", required: true },
          { key: "vehicle_label", label: "Vehicle label" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "is_active", label: "Active", type: "checkbox" }
        ]
      },
      {
        key: "vehicles",
        label: "Vehicles",
        description: "Vehicle registration, capacity, expiry, and maintenance status.",
        table: "transport_vehicles",
        fields: [
          { key: "vehicle_number", label: "Vehicle ID" },
          { key: "vehicle_label", label: "Vehicle" },
          { key: "registration_number", label: "Registration" },
          { key: "capacity", label: "Capacity" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["vehicle_number", "vehicle_label", "registration_number", "status"],
        createFields: [
          { key: "vehicle_label", label: "Vehicle label", required: true },
          { key: "registration_number", label: "Registration number" },
          { key: "capacity", label: "Capacity", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Maintenance", value: "maintenance" },
              { label: "Retired", value: "retired" }
            ]
          },
          { key: "insurance_expires_on", label: "Insurance expires", type: "date" },
          { key: "roadworthy_expires_on", label: "Roadworthy expires", type: "date" }
        ]
      },
      { key: "stops", label: "Stops", description: "Route stop sequence, addresses, pickup, and drop-off times.", table: "transport_stops", fields: [{ key: "name", label: "Stop" }, { key: "address", label: "Address" }, { key: "pickup_time", label: "Pickup" }, { key: "dropoff_time", label: "Drop-off" }], searchFields: ["name", "address"] },
      {
        key: "trips",
        label: "Trip logs",
        description: "Daily pickup/drop-off execution logs.",
        table: "transport_trip_logs",
        fields: [
          { key: "trip_date", label: "Date" },
          { key: "direction", label: "Direction" },
          { key: "students_onboard", label: "Students" },
          { key: "status", label: "Status" },
          { key: "notes", label: "Notes" }
        ],
        searchFields: ["direction", "status", "notes"],
        createFields: [
          { key: "trip_date", label: "Trip date", type: "date" },
          { key: "direction", label: "Direction", type: "select", options: [{ label: "Pickup", value: "pickup" }, { label: "Drop-off", value: "dropoff" }] },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Scheduled", value: "scheduled" },
              { label: "Departed", value: "departed" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" }
            ]
          },
          { key: "students_onboard", label: "Students onboard", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" }
        ]
      },
      { key: "assignments", label: "Student assignments", description: "Learner route assignments and validity dates.", table: "student_transport_assignments", fields: [{ key: "student_id", label: "Student" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }], searchFields: ["student_id"] }
    ]
  },
  {
    key: "inventory",
    title: "Inventory Workspace",
    description: "School stock, supplies, issue/return movements, and reorder monitoring.",
    roles: ["finance_officer", "it_support"],
    modules: [
      {
        key: "items",
        label: "Inventory items",
        description: "Stocked supplies, learning materials, uniforms, and operational consumables.",
        table: "inventory_items",
        fields: [
          { key: "item_number", label: "Item" },
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "quantity_on_hand", label: "Quantity" },
          { key: "status", label: "Status" }
        ],
        searchFields: ["item_number", "name", "category", "unit", "location", "status"],
        createFields: [
          { key: "name", label: "Item name", required: true },
          { key: "category", label: "Category", required: true },
          { key: "unit", label: "Unit", placeholder: "each, pack, box, set..." },
          { key: "quantity_on_hand", label: "Quantity on hand", type: "number" },
          { key: "reorder_level", label: "Reorder level", type: "number" },
          { key: "location", label: "Location" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Low stock", value: "low_stock" },
              { label: "Reserved", value: "reserved" },
              { label: "Retired", value: "retired" }
            ]
          }
        ]
      },
      {
        key: "movements",
        label: "Stock movements",
        description: "Received, issued, returned, adjusted, and disposed stock entries.",
        table: "inventory_movements",
        fields: [
          { key: "movement_number", label: "Movement" },
          { key: "item_label", label: "Item" },
          { key: "movement_type", label: "Type" },
          { key: "quantity", label: "Quantity" },
          { key: "movement_date", label: "Date" }
        ],
        searchFields: ["movement_number", "item_label", "movement_type", "reason"],
        createFields: [
          { key: "item_label", label: "Item name or number", required: true },
          {
            key: "movement_type",
            label: "Movement type",
            type: "select",
            options: [
              { label: "Received", value: "received" },
              { label: "Issued", value: "issued" },
              { label: "Returned", value: "returned" },
              { label: "Adjusted", value: "adjusted" },
              { label: "Disposed", value: "disposed" }
            ]
          },
          { key: "quantity", label: "Quantity", type: "number", required: true },
          { key: "movement_date", label: "Movement date", type: "date" },
          { key: "reason", label: "Reason", type: "textarea" }
        ]
      },
      { key: "devices", label: "Technology assets", description: "Device assets connected to the IT desk.", table: "devices", fields: [{ key: "asset_tag", label: "Asset tag" }, { key: "name", label: "Device" }, { key: "device_type", label: "Type" }, { key: "status", label: "Status" }], searchFields: ["asset_tag", "name", "device_type", "status", "location"] },
      { key: "expenses", label: "Procurement expenses", description: "Expense records connected to purchases and supplies.", table: "expenses", fields: [{ key: "expense_number", label: "Expense" }, { key: "category", label: "Category" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }], searchFields: ["expense_number", "category", "vendor", "status"] }
    ]
  },
  {
    key: "hr",
    title: "HR Workspace",
    description: "People operations, staff records, leave, recruitment, and payroll readiness.",
    roles: ["hr_staff"],
    modules: [
      { key: "staff", label: "Staff profiles", description: "Employment records and staff identifiers.", table: "staff_profiles", fields: [{ key: "staff_number", label: "Staff number" }, { key: "job_title", label: "Job title" }, { key: "employment_type", label: "Employment" }, { key: "hire_date", label: "Hire date" }], searchFields: ["staff_number", "job_title", "employment_type"] },
      { key: "leave", label: "Leave requests", description: "Pending and reviewed staff leave requests.", table: "leave_requests", fields: [{ key: "leave_type", label: "Leave type" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }], searchFields: ["leave_type", "reason", "status"] },
      { key: "recruitment", label: "Applications", description: "Recruitment candidates and review status.", table: "job_applications", fields: [{ key: "first_name", label: "First name" }, { key: "last_name", label: "Last name" }, { key: "email", label: "Email" }, { key: "status", label: "Status" }, { key: "submitted_at", label: "Received" }], searchFields: ["first_name", "last_name", "email", "phone", "status", "cover_letter"] },
      { key: "payroll", label: "Payroll periods", description: "Payroll windows and processing status.", table: "payroll_periods", fields: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }], searchFields: ["name", "status"] },
      { key: "documents", label: "Staff documents", description: "Employment documents, verification status, and expiry tracking.", table: "staff_documents", fields: [{ key: "document_type", label: "Document" }, { key: "status", label: "Status" }, { key: "expires_on", label: "Expires" }, { key: "required_for_employment", label: "Required" }], searchFields: ["document_type", "status"] },
      { key: "tasks", label: "HR tasks", description: "People operations follow-ups and workflow tasks.", table: "workflow_tasks", filter: { key: "workflow_key", value: "hr_follow_up" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }], searchFields: ["task_number", "title", "priority", "status"] }
    ]
  },
  {
    key: "finance",
    title: "Finance Workspace",
    description: "Daily fees, QR payment checks, special invoices, expenses, and payroll controls for school finance.",
    roles: ["finance_officer"],
    modules: [
      { key: "payments", label: "Daily payments", description: "Daily fee captures from student ID or QR scans.", table: "daily_fee_payments", fields: [{ key: "payment_date", label: "Date" }, { key: "student_number", label: "Student ID" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "reference", label: "Reference" }], searchFields: ["student_number", "status", "reference", "notes"] },
      { key: "billing-batches", label: "Daily fee plans", description: "Class-level daily fee amounts used by the finance QR desk.", table: "daily_fee_plans", fields: [{ key: "name", label: "Name" }, { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "is_active", label: "Active" }, { key: "effective_from", label: "From" }], searchFields: ["name", "currency", "notes"] },
      { key: "invoices", label: "Special invoices", description: "Exceptional student invoices outside normal daily fees.", table: "invoices", fields: [{ key: "invoice_number", label: "Invoice" }, { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "status", label: "Status" }, { key: "due_date", label: "Due" }], searchFields: ["invoice_number", "title", "status"] },
      {
        key: "expenses",
        label: "Expenses",
        description: "Expense submissions and approvals.",
        table: "expenses",
        fields: [{ key: "expense_number", label: "Expense" }, { key: "category", label: "Category" }, { key: "amount", label: "Amount" }, { key: "status", label: "Status" }, { key: "expense_date", label: "Date" }],
        searchFields: ["expense_number", "category", "vendor", "status"],
        createFields: [
          { key: "category", label: "Category", required: true },
          { key: "vendor", label: "Vendor" },
          { key: "amount", label: "Amount", type: "number", required: true },
          { key: "currency", label: "Currency", placeholder: "GHS" },
          { key: "expense_date", label: "Expense date", type: "date" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Submitted", value: "submitted" },
              { label: "Approved", value: "approved" },
              { label: "Paid", value: "paid" }
            ]
          }
        ]
      },
      { key: "payroll", label: "Payroll periods", description: "Finance review of payroll windows.", table: "payroll_periods", fields: [{ key: "name", label: "Period" }, { key: "starts_on", label: "Starts" }, { key: "ends_on", label: "Ends" }, { key: "status", label: "Status" }], searchFields: ["name", "status"] },
      { key: "collections", label: "Collection tasks", description: "Payment follow-ups generated from invoices and billing batches.", table: "workflow_tasks", filter: { key: "workflow_key", value: "finance_collection" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }], searchFields: ["task_number", "title", "priority", "status"] }
    ]
  },
  {
    key: "library",
    title: "Library Workspace",
    description: "Catalog, physical copies, circulation, and fine registers.",
    roles: ["librarian"],
    modules: [
      {
        key: "catalog",
        label: "Book catalog",
        description: "Titles, authors, and categories.",
        table: "library_books",
        fields: [{ key: "title", label: "Title" }, { key: "authors", label: "Authors" }, { key: "isbn", label: "ISBN" }, { key: "category", label: "Category" }],
        searchFields: ["title", "authors", "isbn", "category"],
        createFields: [
          { key: "title", label: "Book title", required: true },
          { key: "authors", label: "Authors", type: "tags", placeholder: "Separate authors with commas" },
          { key: "isbn", label: "ISBN" },
          { key: "category", label: "Category" },
          { key: "description", label: "Description", type: "textarea" }
        ]
      },
      { key: "copies", label: "Book copies", description: "Barcode-level inventory and shelf state.", table: "library_copies", fields: [{ key: "barcode", label: "Barcode" }, { key: "shelf_location", label: "Shelf" }, { key: "status", label: "Status" }, { key: "acquired_on", label: "Acquired" }], searchFields: ["barcode", "shelf_location", "status"] },
      { key: "loans", label: "Loans", description: "Borrowed items, due dates, and returns.", table: "library_loans", fields: [{ key: "loaned_at", label: "Loaned" }, { key: "due_at", label: "Due" }, { key: "returned_at", label: "Returned" }, { key: "borrower_profile_id", label: "Borrower" }], searchFields: ["borrower_profile_id"] },
      { key: "fines", label: "Fines", description: "Open, settled, and waived circulation charges.", table: "library_fines", fields: [{ key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "reason", label: "Reason" }, { key: "status", label: "Status" }], searchFields: ["reason", "status"] },
      { key: "library-tasks", label: "Library tasks", description: "Circulation reminders, missing items, and follow-ups.", table: "workflow_tasks", filter: { key: "workflow_key", value: "library_follow_up" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }], searchFields: ["task_number", "title", "priority", "status"] }
    ]
  },
  {
    key: "it",
    title: "IT Support Workspace",
    description: "Device inventory, support tickets, integrations, and platform audit activity.",
    roles: ["it_support"],
    modules: [
      {
        key: "devices",
        label: "Devices",
        description: "School technology assets and assignment status.",
        table: "devices",
        fields: [{ key: "asset_tag", label: "Asset tag" }, { key: "name", label: "Device" }, { key: "device_type", label: "Type" }, { key: "status", label: "Status" }, { key: "location", label: "Location" }],
        searchFields: ["asset_tag", "name", "device_type", "serial_number", "status", "location"],
        createFields: [
          { key: "asset_tag", label: "Asset tag", required: true },
          { key: "name", label: "Device name", required: true },
          { key: "device_type", label: "Device type", required: true },
          { key: "serial_number", label: "Serial number" },
          { key: "location", label: "Location" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "active" },
              { label: "Repair", value: "repair" },
              { label: "Retired", value: "retired" },
              { label: "Lost", value: "lost" }
            ]
          },
          { key: "purchased_on", label: "Purchased on", type: "date" }
        ]
      },
      { key: "tickets", label: "Support tickets", description: "Open technical requests and resolution work.", table: "support_tickets", fields: [{ key: "ticket_number", label: "Ticket" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "category", label: "Category" }], searchFields: ["ticket_number", "title", "priority", "status", "category", "description"] },
      { key: "integrations", label: "Integration events", description: "External service delivery and processing events.", table: "integration_events", fields: [{ key: "source", label: "Source" }, { key: "event_type", label: "Event" }, { key: "external_id", label: "External ID" }, { key: "processed_at", label: "Processed" }, { key: "error", label: "Error" }], searchFields: ["source", "event_type", "external_id", "error"] },
      { key: "audit", label: "Audit log", description: "Recent protected data changes across the platform.", table: "audit_logs", softDelete: false, fields: [{ key: "action", label: "Action" }, { key: "table_name", label: "Table" }, { key: "record_id", label: "Record" }, { key: "created_at", label: "Created" }], searchFields: ["action", "table_name", "record_id"] },
      { key: "automation", label: "IT automation", description: "Platform jobs, support follow-ups, and integration work queue.", table: "workflow_tasks", filter: { key: "workflow_key", value: "it_support" }, fields: [{ key: "task_number", label: "Task" }, { key: "title", label: "Title" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "due_at", label: "Due" }], searchFields: ["task_number", "title", "priority", "status"] },
      { key: "messages", label: "System messages", description: "Queued email and SMS delivery records.", table: "email_outbox", fields: [{ key: "recipient_email", label: "Recipient" }, { key: "subject", label: "Subject" }, { key: "status", label: "Status" }, { key: "attempts", label: "Attempts" }, { key: "scheduled_for", label: "Scheduled" }], searchFields: ["recipient_email", "subject", "status"] }
    ]
  }
];

export function findOperationsWorkspace(key: string) {
  return operationsWorkspaces.find((workspace) => workspace.key === key);
}
