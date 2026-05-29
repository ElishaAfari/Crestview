export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RowWithTimestamps = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type ProfileRow = RowWithTimestamps & {
  role_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  nationality: string | null;
  address: Json | null;
  emergency_contact: Json | null;
  is_active: boolean | null;
  last_seen_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      [key: string]: GenericTable;
      roles: {
        Row: { id: string; name: string; display_name: string; description: string | null; created_at: string | null; updated_at: string | null; deleted_at: string | null };
        Insert: { id?: string; name: string; display_name: string; description?: string | null; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
        Relationships: [];
      };
      permissions: {
        Row: { id: string; name: string; description: string | null; module: string; created_at: string | null; updated_at: string | null; deleted_at: string | null };
        Insert: { id?: string; name: string; description?: string | null; module: string; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["permissions"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id" | "first_name" | "last_name" | "email">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      notifications: {
        Row: RowWithTimestamps & { recipient_id: string; title: string; body: string; type: string; read_at: string | null; metadata: Json | null };
        Insert: { id?: string; recipient_id: string; title: string; body: string; type: string; read_at?: string | null; metadata?: Json | null; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: RowWithTimestamps & { actor_id: string | null; action: string; table_name: string; record_id: string | null; before: Json | null; after: Json | null };
        Insert: { id?: string; actor_id?: string | null; action: string; table_name: string; record_id?: string | null; before?: Json | null; after?: Json | null; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      ai_rate_limits: {
        Row: RowWithTimestamps & { profile_id: string; route: string; window_start: string; request_count: number };
        Insert: { id?: string; profile_id: string; route: string; window_start: string; request_count?: number; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["ai_rate_limits"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: GenericRelationship[] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      risk_level: "green" | "amber" | "red";
      application_status: "submitted" | "reviewing" | "accepted" | "waitlisted" | "rejected";
      invoice_status: "draft" | "open" | "paid" | "overdue" | "void";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type RoleName =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "student"
  | "parent"
  | "hr_staff"
  | "finance_officer"
  | "librarian"
  | "it_support";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
