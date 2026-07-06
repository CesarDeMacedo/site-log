export type RfiStatus = "open" | "in_review" | "answered" | "closed";
export type SubmittalStatus = "open" | "in_review" | "approved" | "rejected";
export type ChangeOrderStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export interface Project {
  id: string;
  name: string;
  general_contractor: string | null;
  pm_name: string | null;
  created_at: string;
}

export interface Rfi {
  id: string;
  project_id: string;
  rfi_number: string;
  description: string;
  discipline: string | null;
  assigned_to: string | null;
  date_submitted: string; // yyyy-mm-dd
  due_date: string; // yyyy-mm-dd
  date_answered: string | null; // yyyy-mm-dd
  status: RfiStatus;
  created_at: string;
  updated_at: string;
}

export interface Submittal {
  id: string;
  project_id: string;
  submittal_number: string;
  item: string;
  supplier: string | null;
  review_step: number;
  review_steps_total: number;
  due_date: string;
  status: SubmittalStatus;
  created_at: string;
  updated_at: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  pco_number: string;
  description: string;
  estimated_cost: number | null;
  status: ChangeOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface ActivityEntry {
  id: string;
  project_id: string;
  entity_type: "rfi" | "submittal" | "change_order";
  entity_id: string;
  entity_label: string;
  message: string;
  created_at: string;
}
