import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { EventsService } from "../domains/events/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

const WhereClause = Type.Optional(
  Type.Array(
    Type.Object({
      column: Type.String(),
      operator: Type.String({ description: 'e.g. "EQ", "LIKE"' }),
      value: Type.Unknown(),
    }),
    { description: "Filter conditions" }
  )
);

const EventDateInput = Type.Object({
  date: Type.String({ description: "YYYY-MM-DD" }),
  start_time: Type.String({ description: "HH:MM (24h)" }),
  end_time: Type.String({ description: "HH:MM (24h)" }),
});

const EventResourceInput = Type.Object({
  resources_id: Type.String({ description: "Entity ID this event is attached to" }),
  resources_type: Type.String({ description: 'e.g. "lead", "deal"' }),
});

const TagInput = Type.Object({
  name: Type.String(),
  slug: Type.Optional(Type.String()),
});

export function registerEventsTools(api: OpenClawPluginApi, service: EventsService, ensureAuth: EnsureAuth) {

  api.registerTool({
    name: "kanvas_list_events_full",
    label: "List Events (full)",
    description: "List or search events with full details. For follow-ups only, see kanvas_list_events.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      search: Type.Optional(Type.String({ description: "Search keyword" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listEvents(params.first, params.search, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_get_event",
    label: "Get Event",
    description: "Get full details for an event by ID, including versions, dates, tags, and custom fields.",
    parameters: Type.Object({
      id: Type.String({ description: "Event ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getEvent(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_create_event",
    label: "Create Event",
    description: "Create an event with dates. Supports linking to resources (leads, deals) and categorization. For a simple lead follow-up, use kanvas_create_follow_up.",
    parameters: Type.Object({
      name: Type.String({ description: "Event name" }),
      slug: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      dates: Type.Array(EventDateInput, { description: "At least one date (YYYY-MM-DD + HH:MM times)" }),
      type_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      status_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      class_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      category_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      theme_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      theme_area_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      resources: Type.Optional(Type.Array(EventResourceInput)),
      participants: Type.Optional(Type.Array(Type.String())),
      tags: Type.Optional(Type.Array(TagInput)),
      custom_fields: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Unknown()))),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createEvent(params as any));
    },
  });

  api.registerTool({
    name: "kanvas_update_event",
    label: "Update Event",
    description: "Update an event's name, description, dates, status, or linked resources.",
    parameters: Type.Object({
      id: Type.String({ description: "Event ID" }),
      name: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      dates: Type.Optional(Type.Array(EventDateInput)),
      type_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      status_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      class_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      category_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      resources_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      resources_type: Type.Optional(Type.String()),
      tags: Type.Optional(Type.Array(TagInput)),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updateEvent(id, input as any));
    },
  });

  api.registerTool({
    name: "kanvas_delete_event",
    label: "Delete Event",
    description: "Delete an event by ID.",
    parameters: Type.Object({
      id: Type.String({ description: "Event ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deleteEvent(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_follow_event",
    label: "Follow Event",
    description: "Subscribe a user to event updates.",
    parameters: Type.Object({
      entity_id: Type.String({ description: "Event UUID" }),
      user_id: Type.Union([Type.String(), Type.Number()], { description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.followEvent(params));
    },
  });

  api.registerTool({
    name: "kanvas_unfollow_event",
    label: "Unfollow Event",
    description: "Unsubscribe a user from event updates.",
    parameters: Type.Object({
      entity_id: Type.String({ description: "Event UUID" }),
      user_id: Type.Union([Type.String(), Type.Number()], { description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.unFollowEvent(params));
    },
  });
}
