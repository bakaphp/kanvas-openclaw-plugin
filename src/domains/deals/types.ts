export interface CreateDealInput {
  title: string;
  description?: string;
  leads_id?: string | number;
  people_id?: string | number;
  organization_id?: string | number;
  owner_id?: string | number;
  pipeline_id?: string | number;
  pipeline_stage_id?: string | number;
  status_id?: number;
  status?: number;
  companies_branches_id?: string | number;
}

export interface UpdateDealInput {
  title?: string;
  description?: string;
  leads_id?: string | number;
  people_id?: string | number;
  organization_id?: string | number;
  owner_id?: string | number;
  pipeline_id?: string | number;
  pipeline_stage_id?: string | number;
  status_id?: number;
  status?: number;
  companies_branches_id?: string | number;
}
