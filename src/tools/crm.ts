import { CrmService } from "../domains/crm/index.js";

export function createCrmTools(service: CrmService) {
  return {
    kanvas_search_leads: (search: string, first?: number) => service.searchLeads(search, first),
    kanvas_get_lead: (id: string) => service.getLead(id),
    kanvas_create_lead: (input: Record<string, unknown>) => service.createLead(input),
  };
}
