export type PlanStatus =
  | "draft"
  | "awaiting_approval"
  | "active"
  | "blocked"
  | "done"
  | "failed"
  | "cancelled";

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "done"
  | "failed"
  | "cancelled";

export interface NervousSystemTaskInput {
  title: string;
  sequence?: number;
  description?: string;
  status?: TaskStatus | string;
  result?: Record<string, unknown>;
  blocked_reason?: string;
}

export interface FilesystemInputUrl {
  url: string;
  name: string;
  field_name?: string;
}

export interface CreateNervousSystemPlanInput {
  title: string;
  plan_type: string;
  agent_id?: number;
  users_id?: number;
  parent_plan_id?: number;
  entity_namespace?: string;
  entity_id?: number;
  description?: string;
  status?: PlanStatus | string;
  priority?: number;
  deadline_at?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  confidence_score?: number;
  requires_human_approval?: boolean;
  tasks?: NervousSystemTaskInput[];
  files?: FilesystemInputUrl[];
}

export interface UpdateNervousSystemPlanInput {
  title?: string;
  description?: string;
  status?: PlanStatus | string;
  priority?: number;
  deadline_at?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  confidence_score?: number;
  requires_human_approval?: boolean;
  files?: FilesystemInputUrl[];
}

export interface UpdateNervousSystemTaskStatusInput {
  status: TaskStatus | string;
  result?: Record<string, unknown>;
  blocked_reason?: string;
}

export interface ApproveNervousSystemPlanInput {
  approved: boolean;
  review_outcome?: string;
}
