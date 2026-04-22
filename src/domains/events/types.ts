export interface EventDateInput {
  date: string;          // YYYY-MM-DD
  start_time: string;    // HH:MM (24h)
  end_time: string;      // HH:MM (24h)
}

export interface EventResourceInput {
  resources_id: string;
  resources_type: string;
}

export interface CreateEventInput {
  name: string;
  slug?: string;
  description?: string;
  theme_id?: string | number;
  theme_area_id?: string | number;
  status_id?: string | number;
  type_id?: string | number;
  class_id?: string | number;
  category_id?: string | number;
  resources?: EventResourceInput[];
  config?: Record<string, unknown>;
  participants?: string[];
  dates: EventDateInput[];
  custom_fields?: Array<Record<string, unknown>>;
  tags?: Array<{ name: string; slug?: string }>;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  theme_id?: string | number;
  theme_area_id?: string | number;
  status_id?: string | number;
  type_id?: string | number;
  class_id?: string | number;
  category_id?: string | number;
  resources_id?: string | number;
  resources_type?: string;
  dates?: EventDateInput[];
  custom_fields?: Array<Record<string, unknown>>;
  tags?: Array<{ name: string; slug?: string }>;
}

export interface EventFollowInput {
  entity_id: string;
  user_id: string | number;
}
