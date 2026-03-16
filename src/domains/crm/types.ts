export interface LeadContactInput {
  value: string;
  contacts_types_id: number;
  weight?: number;
}

export interface LeadPeopleInput {
  firstname: string;
  lastname: string;
  contacts?: LeadContactInput[];
}

export interface LeadOrganizationInput {
  name: string;
}

export interface CreateLeadInput {
  title: string;
  pipeline_stage_id: number;
  people: LeadPeopleInput;
  branch_id?: string | number;
  leads_owner_id?: string | number;
  receiver_id?: string | number;
  status_id?: string | number;
  type_id?: string | number;
  source_id?: string | number;
  description?: string;
  reason_lost?: string;
  organization?: LeadOrganizationInput;
  custom_fields?: Array<Record<string, unknown>>;
  files?: Array<Record<string, unknown>>;
}

export interface UpdateLeadInput {
  branch_id: string | number;
  people_id: string | number;
  title?: string;
  leads_owner_id?: string | number;
  organization_id?: string | number;
  receiver_id?: string | number;
  status_id?: string | number;
  type_id?: string | number;
  source_id?: string | number;
  description?: string;
  reason_lost?: string;
  pipeline_stage_id?: string | number;
  custom_fields?: Array<Record<string, unknown>>;
  files?: Array<Record<string, unknown>>;
}

export interface LeadParticipantInput {
  lead_id: number;
  people_id: number;
  relationship_id: number;
}

export type LeadOutcomeStatus = "Won" | "Lost" | "Close";

export interface LeadMessageInput {
  channel_slug: string;
  message: string;
  parent_id?: string | number;
  is_public?: number;
  files?: File[];
  custom_fields?: Array<Record<string, unknown>>;
}

export interface LeadAppointmentDateInput {
  date: string;
  start_time: string;
  end_time: string;
}

export interface LeadAppointmentResourceInput {
  resources_id: string | number;
  resources_type: string;
  custom_fields?: Array<Record<string, unknown>>;
}

export interface CreateLeadAppointmentInput {
  name: string;
  description?: string;
  resources: LeadAppointmentResourceInput[];
  dates: LeadAppointmentDateInput[];
}

export interface LeadFileUploadInput {
  leadId: string | number;
  fileName: string;
  contentType?: string;
  content: Buffer | Uint8Array | Blob | string;
  params?: Record<string, unknown>;
}
