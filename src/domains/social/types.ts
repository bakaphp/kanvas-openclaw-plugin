export interface CreateMessageInput {
  message_verb: string;
  message: Record<string, unknown>;
  parent_id?: string | number;
  entity_id?: string | number;
  channel_slug?: string;
  is_public?: number;
  tags?: Array<{ name: string; slug?: string }>;
  custom_fields?: Array<Record<string, unknown>>;
}

export interface UpdateMessageInput {
  message?: Record<string, unknown>;
  message_verb?: string;
  is_public?: number;
  is_locked?: number;
  is_deleted?: number;
  tags?: Array<{ name: string; slug?: string }>;
  custom_fields?: Array<Record<string, unknown>>;
}

export interface CreateMessageTypeInput {
  languages_id: number;
  name: string;
  verb: string;
  template?: Record<string, unknown>;
  templates_plura?: string;
}

export interface MessageWhereCondition {
  column: string;
  operator: string;
  value: unknown;
}

export interface SendAnonymousEmailInput {
  template_name: string;
  data: Record<string, unknown>;
  email: string;
  subject: string;
  attachment?: string[];
}
