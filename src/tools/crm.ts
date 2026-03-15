import { CrmService } from "../domains/crm/index.js";
import { CreateLeadInput, UpdateLeadInput } from "../domains/crm/types.js";

export function createCrmTools(service: CrmService) {
  return {
    kanvas_search_leads: (search: string, first?: number) => service.searchLeads(search, first),
    kanvas_get_lead: (id: string) => service.getLead(id),
    kanvas_create_lead: (input: CreateLeadInput) => service.createLead(input),
    kanvas_update_lead: (id: string, input: UpdateLeadInput) => service.updateLead(id, input),
    kanvas_list_pipelines: (first?: number) => service.listPipelines(first),
    kanvas_list_lead_statuses: (first?: number) => service.listLeadStatuses(first),
    kanvas_list_lead_sources: (first?: number) => service.listLeadSources(first),
    kanvas_list_lead_types: (first?: number) => service.listLeadTypes(first),
  };
}
