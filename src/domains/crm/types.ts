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
