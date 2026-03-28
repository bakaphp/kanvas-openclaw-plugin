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
    description: "Update an existing lead's fields. branch_id and people_id are auto-fetched if not provided.",
    parameters: Type.Object({
      id: Type.String({ description: "Lead ID" }),
      input: Type.Object({
        branch_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Auto-fetched if omitted" })),
        people_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Auto-fetched if omitted" })),
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

  api.registerTool({
    name: "kanvas_attach_file_to_lead_by_url",
    label: "Attach File to Lead by URL",
    description:
      "Attach a file (PDF, image, document) to a lead using a public URL. " +
      "The file is downloaded by the server and attached to the lead.",
    parameters: Type.Object({
      leadId: Type.String({ description: "Lead ID" }),
      fileUrl: Type.String({ description: "Public URL of the file to attach" }),
      fileName: Type.String({ description: "File name (e.g. proposal.pdf, photo.jpg)" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.attachFileToLeadByUrl(params.leadId, params.fileUrl, params.fileName));
    },
  });

  api.registerTool({
    name: "kanvas_upload_file_to_lead",
    label: "Upload File to Lead",
    description:
      "Upload a file to a lead. Provide the content as base64, a local file path, or a URL to download from. " +
      "Exactly one of base64, filePath, or url must be provided.",
    parameters: Type.Object({
      leadId: Type.String({ description: "Lead ID" }),
      fileName: Type.String({ description: "File name with extension (e.g. proposal.pdf, photo.jpg)" }),
      base64: Type.Optional(Type.String({ description: "Base64-encoded file content" })),
      filePath: Type.Optional(Type.String({ description: "Absolute path to a local file" })),
      url: Type.Optional(Type.String({ description: "URL to download the file from" })),
      contentType: Type.Optional(Type.String({ description: "MIME type (auto-detected from extension if omitted)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { leadId, fileName, contentType, ...source } = params;
      return toolResult(await service.uploadFileToLead(leadId, fileName, source, contentType));
    },
  });

  api.registerTool({
    name: "kanvas_upload_file_to_message",
    label: "Upload File to Message",
    description:
      "Upload a file to a message. Provide the content as base64, a local file path, or a URL to download from.",
    parameters: Type.Object({
      messageId: Type.String({ description: "Message ID" }),
      fileName: Type.String({ description: "File name with extension" }),
      base64: Type.Optional(Type.String({ description: "Base64-encoded file content" })),
      filePath: Type.Optional(Type.String({ description: "Absolute path to a local file" })),
      url: Type.Optional(Type.String({ description: "URL to download the file from" })),
      contentType: Type.Optional(Type.String({ description: "MIME type (auto-detected if omitted)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { messageId, fileName, contentType, ...source } = params;
      return toolResult(await service.uploadFileToMessage(messageId, fileName, source, contentType));
    },
  });

  // --- People / Contacts ---

  api.registerTool({
    name: "kanvas_search_people",
    label: "Search People",
    description: "Search contacts/people by name, email, or phone.",
    parameters: Type.Object({
      search: Type.String({ description: "Search keyword" }),
      first: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.searchPeople(params.search, params.first));
    },
  });

  api.registerTool({
    name: "kanvas_update_people",
    label: "Update People/Contact",
    description:
      "Update a person's profile — name, phone, email, address, tags, custom fields. " +
      "To add contacts (phone/email), pass contacts array with value and contacts_types_id. " +
      "Call kanvas_list_contact_types first to get valid contact type IDs.",
    parameters: Type.Object({
      id: Type.String({ description: "People ID" }),
      input: Type.Object({
        firstname: Type.Optional(Type.String()),
        middlename: Type.Optional(Type.String()),
        lastname: Type.Optional(Type.String()),
        dob: Type.Optional(Type.String({ description: "Date of birth (YYYY-MM-DD)" })),
        organization: Type.Optional(Type.String()),
        contacts: Type.Optional(Type.Array(Type.Object({
          value: Type.String({ description: "Phone number, email, etc." }),
          contacts_types_id: Type.Union([Type.String(), Type.Number()], { description: "Contact type ID (call kanvas_list_contact_types)" }),
          weight: Type.Optional(Type.Number()),
          is_opt_out: Type.Optional(Type.Boolean()),
        }))),
        tags: Type.Optional(Type.Array(Type.Object({ name: Type.String() }))),
        custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()))),
      }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.updatePeople(params.id, params.input));
    },
  });

  api.registerTool({
    name: "kanvas_list_people_relationships",
    label: "List People Relationships",
    description: "List available relationship types for lead participants (e.g. Architect, Client, Consultant).",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listPeopleRelationships(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_create_people_relationship",
    label: "Create People Relationship",
    description: "Create a new relationship type (e.g. Architect, Client, Consultant) for use when adding participants to leads.",
    parameters: Type.Object({
      name: Type.String({ description: 'Relationship name (e.g. "Architect", "Consultant", "Decision Maker")' }),
      description: Type.Optional(Type.String({ description: "Description of this relationship type" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createPeopleRelationship(params));
    },
  });

  api.registerTool({
    name: "kanvas_update_people_relationship",
    label: "Update People Relationship",
    description: "Update a relationship type's name or description.",
    parameters: Type.Object({
      id: Type.String({ description: "Relationship ID" }),
      name: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updatePeopleRelationship(id, input));
    },
  });

  api.registerTool({
    name: "kanvas_delete_people_relationship",
    label: "Delete People Relationship",
    description: "Delete a relationship type.",
    parameters: Type.Object({
      id: Type.String({ description: "Relationship ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deletePeopleRelationship(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_list_contact_types",
    label: "List Contact Types",
    description: "List available contact types (email, phone, etc.) needed for adding contacts to people.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listContactTypes(params.first));
    },
  });

  // --- Events / Follow-ups ---

  api.registerTool({
    name: "kanvas_create_follow_up",
    label: "Create Follow-up",
    description:
      "Schedule a follow-up reminder as a calendar event. Optionally link to a lead. " +
      "Use this for any action that needs to happen on a future date — the team can see it in the Kanvas dashboard.",
    parameters: Type.Object({
      name: Type.String({ description: 'Follow-up name (e.g. "Call Jane Doe re: proposal")' }),
      description: Type.Optional(Type.String({ description: "Details/notes about the follow-up" })),
      date: Type.String({ description: "Date (YYYY-MM-DD)" }),
      start_time: Type.String({ description: "Start time (HH:MM, 24h format)" }),
      end_time: Type.String({ description: "End time (HH:MM, 24h format)" }),
      lead_id: Type.Union([Type.String(), Type.Number()], { description: "Lead ID to link this follow-up to" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createFollowUpEvent(params));
    },
  });

  api.registerTool({
    name: "kanvas_list_events",
    label: "List Events",
    description: "List scheduled events/follow-ups with optional filtering.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      where: Type.Optional(Type.Array(Type.Object({
        column: Type.String({ description: 'e.g. "ID", "NAME"' }),
        operator: Type.String({ description: 'e.g. "EQ", "LIKE"' }),
        value: Type.Unknown(),
      }))),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listEvents(params.first, params.where as any));
    },
  });
}
