// ── User ─────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'sales_manager' | 'agent';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// ── Company ───────────────────────────────────────────────────────────────────
export type Industry = 'tech' | 'healthcare' | 'finance' | 'retail' | 'other';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';

export interface Company {
  id: number;
  name: string;
  industry: Industry;
  website: string | null;
  size: CompanySize | null;
  user_id: number;
  leads_count?: number;
  created_at: string;
}

// ── Lead ──────────────────────────────────────────────────────────────────────
export type LeadStatus =
  | 'new' | 'contacted' | 'qualified'
  | 'proposal' | 'negotiation'
  | 'closed_won' | 'closed_lost';

export type LeadPriority = 'high' | 'medium' | 'low';
export type AiBadge = 'hot' | 'warm' | 'cold' | 'unscored';

export interface Lead {
  id: number;
  title: string;
  company_id: number;
  company?: Company;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  value: number;           // cents
  value_in_dollars?: number;
  status: LeadStatus;
  priority: LeadPriority;
  last_contact_date: string | null;
  next_followup_date: string | null;
  notes: string | null;
  ai_score: number | null;
  ai_reason: string | null;
  ai_badge?: AiBadge;
  days_since_contact?: number | null;
  user_id: number;
  assigned_to?: User;
  activities?: Activity[];
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface LeadFilters {
  status?: LeadStatus | '';
  priority?: LeadPriority | '';
  search?: string;
  user_id?: number | '';
  overdue?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
}

// ── Activity ──────────────────────────────────────────────────────────────────
export type ActivityType =
  | 'email_sent' | 'call_made' | 'meeting_scheduled'
  | 'note_added' | 'status_changed';

export interface Activity {
  id: number;
  lead_id: number;
  user_id: number;
  user?: User;
  type: ActivityType;
  content: string;
  created_at: string;
}

// ── Attachment ────────────────────────────────────────────────────────────────
export interface Attachment {
  id: number;
  lead_id: number;
  user_id: number;
  filename: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface PipelineStatus {
  status: LeadStatus;
  count: number;
  total_value: number;
}

export interface DashboardStats {
  summary: {
    total_leads: number;
    total_pipeline: number;
    won_this_month: number;
    overdue_followups: number;
  };
  pipeline_by_status: Record<LeadStatus, PipelineStatus>;
  hot_leads: Lead[];
  leaderboard: Array<{
    id: number;
    name: string;
    role: UserRole;
    won_count: number;
    won_value: number;
  }> | null;
}

// ── Anomaly ───────────────────────────────────────────────────────────────────
export type RiskLevel = 'high' | 'medium' | 'low';

export interface Anomaly {
  lead_id: number;
  lead_title: string;
  company: string;
  days_stalled: number | null;
  risk_level: RiskLevel;
  suggestion: string;
  detected_at: string;
}

// ── Notification ──────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: string;
  data: {
    type: string;
    lead_id: number;
    title: string;
    message: string;
    old_status?: string;
    new_status?: string;
  };
  read_at: string | null;
  created_at: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── API Error ─────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
