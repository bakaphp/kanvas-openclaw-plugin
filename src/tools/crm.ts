import { CrmService } from "../domains/crm/index.js";
import {
  CreateLeadAppointmentInput,
  CreateLeadInput,
  LeadFileUploadInput,
  LeadMessageInput,
  LeadOutcomeStatus,
  LeadParticipantInput,
  UpdateLeadInput,
} from "../domains/crm/types.js";

export function createCrmTools(service: CrmService) {
  return {
    kanvas_search_leads: (search: string, first?: number) => service.searchLeads(search, first),
    kanvas_get_lead: (id: string) => service.getLead(id),
    kanvas_create_lead: (input: CreateLeadInput) => service.createLead(input),
    kanvas_update_lead: (id: string, input: UpdateLeadInput) => service.updateLead(id, input),
    kanvas_add_lead_participant: (input: LeadParticipantInput) => service.addLeadParticipant(input),
    kanvas_remove_lead_participant: (input: LeadParticipantInput) => service.removeLeadParticipant(input),
    kanvas_mark_lead_outcome: (id: string, status: LeadOutcomeStatus, reason_lost?: string) =>
      service.markLeadOutcome(id, status, reason_lost),
    kanvas_create_lead_appointment: (input: CreateLeadAppointmentInput) =>
      service.createLeadAppointment(input),
    kanvas_add_lead_message: (input: LeadMessageInput) => service.addLeadMessage(input),
    kanvas_list_lead_messages: (channelSlug: string, first?: number, page?: number) =>
      service.listLeadMessages(channelSlug, first, page),
    kanvas_get_lead_primary_channel_slug: (leadId: string) => service.getLeadPrimaryChannelSlug(leadId),
    kanvas_attach_file_to_lead: (input: LeadFileUploadInput) => service.attachFileToLead(input),
    kanvas_list_pipelines: (first?: number) => service.listPipelines(first),
    kanvas_list_lead_statuses: (first?: number) => service.listLeadStatuses(first),
    kanvas_list_lead_sources: (first?: number) => service.listLeadSources(first),
    kanvas_list_lead_types: (first?: number) => service.listLeadTypes(first),
  };
}
