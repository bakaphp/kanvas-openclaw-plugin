import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { SocialService } from "../domains/social/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

const WhereCondition = Type.Optional(
  Type.Object({
    column: Type.String({ description: 'Column name (e.g. "ID", "SLUG", "VERB")' }),
    operator: Type.String({ description: 'Operator (e.g. "EQ", "LIKE", "IN")' }),
    value: Type.Unknown({ description: "Filter value" }),
  })
);

const TagInput = Type.Object({
  name: Type.String(),
  slug: Type.Optional(Type.String()),
});

export function registerSocialTools(api: OpenClawPluginApi, service: SocialService, ensureAuth: EnsureAuth) {
  api.registerTool({
    name: "kanvas_create_message",
    label: "Create Message",
    description:
      "Create a message with an arbitrary JSON payload. Messages act as NoSQL-like document storage — " +
      "the message field accepts any JSON structure. Use message_verb to define the type (auto-created if new). " +
      "Optionally link to an entity via channel_slug or entity_id.",
    parameters: Type.Object({
      message_verb: Type.String({
        description: 'Message type verb (e.g. "comment", "note", "sms", or any custom verb). Auto-created if it doesn\'t exist.',
      }),
      message: Type.Record(Type.String(), Type.Unknown(), {
        description: "Arbitrary JSON payload — any structure is accepted.",
      }),
      channel_slug: Type.Optional(Type.String({ description: "Channel slug to post the message to" })),
      entity_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Entity ID to link this message to" })),
      parent_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Parent message ID for threading" })),
      is_public: Type.Optional(Type.Number({ description: "1 = public, 0 = internal (default)" })),
      tags: Type.Optional(Type.Array(TagInput, { description: "Tags to attach" })),
      custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()), { description: "Custom field key-value pairs" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createMessage(params));
    },
  });

  api.registerTool({
    name: "kanvas_get_message",
    label: "Get Message",
    description: "Get full details for a single message by ID, including children, files, tags, and entity links.",
    parameters: Type.Object({
      id: Type.String({ description: "Message ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getMessage(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_update_message",
    label: "Update Message",
    description: "Update a message's JSON content, visibility, lock status, or tags.",
    parameters: Type.Object({
      id: Type.String({ description: "Message ID" }),
      message: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "Updated JSON payload" })),
      message_verb: Type.Optional(Type.String({ description: "Change the message type verb" })),
      is_public: Type.Optional(Type.Number({ description: "1 = public, 0 = internal" })),
      is_locked: Type.Optional(Type.Number({ description: "1 = locked, 0 = unlocked" })),
      tags: Type.Optional(Type.Array(TagInput)),
      custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()))),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updateMessage(id, input));
    },
  });

  api.registerTool({
    name: "kanvas_delete_message",
    label: "Delete Message",
    description: "Soft-delete a message.",
    parameters: Type.Object({
      id: Type.String({ description: "Message ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deleteMessage(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_list_channel_messages",
    label: "List Channel Messages",
    description: "List messages in a channel by slug. Useful for getting all messages linked to an entity (lead, order, etc.).",
    parameters: Type.Object({
      channel_slug: Type.String({ description: "Channel slug" }),
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      page: Type.Optional(Type.Number({ description: "Page number (default 1)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listChannelMessages(params.channel_slug, params.first, params.page));
    },
  });

  api.registerTool({
    name: "kanvas_search_messages",
    label: "Search Messages",
    description:
      "Search messages with optional filters by message type (verb), channel, entity, or free text. " +
      "Use hasType to filter by verb, hasChannel to filter by channel slug/entity, hasAppModuleMessage to filter by linked entity.",
    parameters: Type.Object({
      search: Type.Optional(Type.String({ description: "Free text search" })),
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      where: WhereCondition,
      hasType: Type.Optional(
        Type.Object({
          column: Type.String({ description: 'e.g. "VERB" or "NAME"' }),
          operator: Type.String({ description: 'e.g. "EQ"' }),
          value: Type.Unknown({ description: 'e.g. "comment"' }),
        }, { description: "Filter by message type" })
      ),
      hasChannel: Type.Optional(
        Type.Object({
          column: Type.String({ description: 'e.g. "SLUG", "ENTITY_ID", "ENTITY_NAMESPACE"' }),
          operator: Type.String({ description: 'e.g. "EQ"' }),
          value: Type.Unknown(),
        }, { description: "Filter by channel" })
      ),
      hasAppModuleMessage: Type.Optional(
        Type.Object({
          column: Type.String({ description: 'e.g. "ENTITY_ID", "SYSTEM_MODULES"' }),
          operator: Type.String({ description: 'e.g. "EQ"' }),
          value: Type.Unknown(),
        }, { description: "Filter by linked entity" })
      ),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(
        await service.searchMessages(
          params.search,
          params.first,
          params.hasType,
          params.hasChannel,
          params.hasAppModuleMessage,
          params.where
        )
      );
    },
  });

  api.registerTool({
    name: "kanvas_list_message_types",
    label: "List Message Types",
    description: "List all available message types (verbs) for the current app.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listMessageTypes(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_create_message_type",
    label: "Create Message Type",
    description: "Create a new message type with a unique verb and optional JSON template schema.",
    parameters: Type.Object({
      name: Type.String({ description: "Display name" }),
      verb: Type.String({ description: 'Unique verb identifier (e.g. "invoice_data", "vehicle_spec")' }),
      languages_id: Type.Number({ description: "Language ID (typically 1 for English)" }),
      template: Type.Optional(Type.Record(Type.String(), Type.Unknown(), { description: "JSON template/schema for this message type" })),
      templates_plura: Type.Optional(Type.String({ description: "Plural form of the name" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createMessageType(params));
    },
  });

  api.registerTool({
    name: "kanvas_send_anonymous_email",
    label: "Send Anonymous Email",
    description:
      "Send an email to any address using a notification template. Does not require the recipient to be a Kanvas user. " +
      "Requires xKanvasKey (app-key) to be configured.",
    parameters: Type.Object({
      template_name: Type.String({ description: "Notification template name" }),
      data: Type.Record(Type.String(), Type.Unknown(), {
        description: "Template data — variables to interpolate into the template",
      }),
      email: Type.String({ description: "Recipient email address" }),
      subject: Type.String({ description: "Email subject line" }),
      attachment: Type.Optional(Type.Array(Type.String(), { description: "File paths/URLs to attach" })),
    }),
    async execute(_id, params) {
      return toolResult(await service.sendAnonymousEmail(params));
    },
  });
}
