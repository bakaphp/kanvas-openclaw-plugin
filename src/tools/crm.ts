import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { CrmService } from "../domains/crm/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

export function registerCrmTools(api: OpenClawPluginApi, service: CrmService, ensureAuth: EnsureAuth) {
  api.registerTool({
    name: "kanvas_search_leads",
    label: "Search Leads",
    description: "Search leads by keyword in the Kanvas CRM.",
    parameters: Type.Object({
      search: Type.String({ description: "Search keyword" }),
      first: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.searchLeads(params.search, params.first));
    },
  });

  api.registerTool({
    name: "kanvas_get_lead",
    label: "Get Lead",
    description: "Get full details for a single lead by ID, including channels, participants, events, and files.",
    parameters: Type.Object({
      id: Type.String({ description: "Lead ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getLead(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_create_lead",
    label: "Create Lead",
    description: "Create a new lead in the Kanvas CRM.",
    parameters: Type.Object({
      title: Type.String({ description: "Lead title" }),
      pipeline_stage_id: Type.Number({ description: "Pipeline stage ID" }),
      people: Type.Object({
        firstname: Type.String(),
        lastname: Type.String(),
        contacts: Type.Optional(Type.Array(Type.Object({
          value: Type.String(),
          contacts_types_id: Type.Number(),
          weight: Type.Optional(Type.Number()),
        }))),
      }, { description: "Contact person details" }),
      branch_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      leads_owner_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      receiver_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      status_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      type_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      source_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      description: Type.Optional(Type.String()),
      reason_lost: Type.Optional(Type.String()),
      organization: Type.Optional(Type.Object({ name: Type.String() })),
      custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()))),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createLead(params));
    },
  });

  api.registerTool({
    name: "kanvas_update_lead",
    label: "Update Lead",
    description: "Update an existing lead's fields.",
    parameters: Type.Object({
      id: Type.String({ description: "Lead ID" }),
      input: Type.Object({
        branch_id: Type.Union([Type.String(), Type.Number()]),
        people_id: Type.Union([Type.String(), Type.Number()]),
        title: Type.Optional(Type.String()),
        leads_owner_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        organization_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        receiver_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        status_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        type_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        source_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        description: Type.Optional(Type.String()),
        reason_lost: Type.Optional(Type.String()),
        pipeline_stage_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
        custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()))),
      }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.updateLead(params.id, params.input));
    },
  });

  api.registerTool({
    name: "kanvas_change_lead_owner",
    label: "Change Lead Owner",
    description: "Change the owner of a lead.",
    parameters: Type.Object({
      leadId: Type.Union([Type.String(), Type.Number()], { description: "Lead ID" }),
      branch_id: Type.Union([Type.String(), Type.Number()]),
      people_id: Type.Union([Type.String(), Type.Number()]),
      title: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      leads_owner_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "New owner ID" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.changeLeadOwner(params));
    },
  });

  api.registerTool({
    name: "kanvas_change_lead_receiver",
    label: "Change Lead Receiver",
    description: "Change the receiver of a lead.",
    parameters: Type.Object({
      leadId: Type.Union([Type.String(), Type.Number()], { description: "Lead ID" }),
      branch_id: Type.Union([Type.String(), Type.Number()]),
      people_id: Type.Union([Type.String(), Type.Number()]),
      title: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      receiver_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "New receiver ID" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.changeLeadReceiver(params));
    },
  });

  api.registerTool({
    name: "kanvas_add_lead_participant",
    label: "Add Lead Participant",
    description: "Add a participant to a lead.",
    parameters: Type.Object({
      lead_id: Type.Number({ description: "Lead ID" }),
      people_id: Type.Number({ description: "Person ID" }),
      relationship_id: Type.Number({ description: "Relationship type ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.addLeadParticipant(params));
    },
  });

  api.registerTool({
    name: "kanvas_remove_lead_participant",
    label: "Remove Lead Participant",
    description: "Remove a participant from a lead.",
    parameters: Type.Object({
      lead_id: Type.Number({ description: "Lead ID" }),
      people_id: Type.Number({ description: "Person ID" }),
      relationship_id: Type.Number({ description: "Relationship type ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.removeLeadParticipant(params));
    },
  });

  api.registerTool({
    name: "kanvas_follow_lead",
    label: "Follow Lead",
    description: "Follow a lead to receive updates.",
    parameters: Type.Object({
      entity_id: Type.String({ description: "Lead entity ID" }),
      user_id: Type.Union([Type.String(), Type.Number()], { description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.followLead(params));
    },
  });

  api.registerTool({
    name: "kanvas_unfollow_lead",
    label: "Unfollow Lead",
    description: "Unfollow a lead to stop receiving updates.",
    parameters: Type.Object({
      entity_id: Type.String({ description: "Lead entity ID" }),
      user_id: Type.Union([Type.String(), Type.Number()], { description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.unFollowLead(params));
    },
  });

  api.registerTool({
    name: "kanvas_delete_lead",
    label: "Delete Lead",
    description: "Soft-delete a lead.",
    parameters: Type.Object({
      id: Type.String({ description: "Lead ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deleteLead(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_restore_lead",
    label: "Restore Lead",
    description: "Restore a previously deleted lead.",
    parameters: Type.Object({
      id: Type.String({ description: "Lead ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.restoreLead(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_mark_lead_outcome",
    label: "Mark Lead Outcome",
    description: "Mark a lead as Won, Lost, or Closed.",
    parameters: Type.Object({
      id: Type.String({ description: "Lead ID" }),
      status: Type.Union([Type.Literal("Won"), Type.Literal("Lost"), Type.Literal("Close")], {
        description: "Outcome status",
      }),
      reason_lost: Type.Optional(Type.String({ description: "Reason for losing (if status is Lost)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.markLeadOutcome(params.id, params.status, params.reason_lost));
    },
  });

  api.registerTool({
    name: "kanvas_create_lead_appointment",
    label: "Create Lead Appointment",
    description: "Create a calendar event/appointment linked to a lead.",
    parameters: Type.Object({
      name: Type.String({ description: "Appointment name" }),
      description: Type.Optional(Type.String()),
      resources: Type.Array(Type.Object({
        resources_id: Type.Union([Type.String(), Type.Number()]),
        resources_type: Type.String(),
        custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()))),
      })),
      dates: Type.Array(Type.Object({
        date: Type.String({ description: "Date (YYYY-MM-DD)" }),
        start_time: Type.String({ description: "Start time (HH:MM)" }),
        end_time: Type.String({ description: "End time (HH:MM)" }),
      })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createLeadAppointment(params));
    },
  });

  api.registerTool({
    name: "kanvas_add_lead_message",
    label: "Add Lead Message",
    description: "Add a message/note to a lead's channel by channel slug.",
    parameters: Type.Object({
      channel_slug: Type.String({ description: "Channel slug" }),
      message: Type.String({ description: "Message text" }),
      parent_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Parent message ID for threading" })),
      is_public: Type.Optional(Type.Number({ description: "1 = public, 0 = internal" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.addLeadMessage(params));
    },
  });

  api.registerTool({
    name: "kanvas_add_lead_note_by_lead_id",
    label: "Add Lead Note by Lead ID",
    description: "Add a message/note to a lead by lead ID. Automatically resolves the primary channel.",
    parameters: Type.Object({
      leadId: Type.Union([Type.String(), Type.Number()], { description: "Lead ID" }),
      message: Type.String({ description: "Message text" }),
      parent_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      is_public: Type.Optional(Type.Number({ description: "1 = public, 0 = internal" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.addLeadMessageByLeadId(params));
    },
  });

  api.registerTool({
    name: "kanvas_list_lead_messages",
    label: "List Lead Messages",
    description: "List messages/notes in a lead's channel.",
    parameters: Type.Object({
      channel_slug: Type.String({ description: "Channel slug" }),
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
      page: Type.Optional(Type.Number({ description: "Page number (default 1)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listLeadMessages(params.channel_slug, params.first, params.page));
    },
  });

  api.registerTool({
    name: "kanvas_get_lead_primary_channel_slug",
    label: "Get Lead Primary Channel",
    description: "Get the primary channel slug for a lead.",
    parameters: Type.Object({
      leadId: Type.String({ description: "Lead ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getLeadPrimaryChannelSlug(params.leadId));
    },
  });

  api.registerTool({
    name: "kanvas_list_pipelines",
    label: "List Pipelines",
    description: "List all pipelines and their stages.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listPipelines(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_list_lead_statuses",
    label: "List Lead Statuses",
    description: "List available lead statuses.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listLeadStatuses(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_list_lead_sources",
    label: "List Lead Sources",
    description: "List available lead sources.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listLeadSources(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_list_lead_types",
    label: "List Lead Types",
    description: "List available lead types.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listLeadTypes(params.first));
    },
  });
}
