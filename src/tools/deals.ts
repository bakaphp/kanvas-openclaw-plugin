import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { DealsService } from "../domains/deals/index.js";
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

export function registerDealsTools(api: OpenClawPluginApi, service: DealsService, ensureAuth: EnsureAuth) {

  api.registerTool({
    name: "kanvas_list_deals",
    label: "List Deals",
    description: "List or search deals. A deal represents a potential sale/opportunity linked to a lead, person, or organization.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      search: Type.Optional(Type.String({ description: "Search keyword" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listDeals(params.first, params.search, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_get_deal",
    label: "Get Deal",
    description: "Get full details for a deal by ID, including pipeline stage, owner, linked lead/person/org, tags, and custom fields.",
    parameters: Type.Object({
      id: Type.String({ description: "Deal ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getDeal(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_create_deal",
    label: "Create Deal",
    description: "Create a deal. Only title is required. Optionally link to a lead, person, organization, or pipeline stage.",
    parameters: Type.Object({
      title: Type.String({ description: "Deal title" }),
      description: Type.Optional(Type.String()),
      leads_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Linked lead ID" })),
      people_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Linked person ID" })),
      organization_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      owner_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Deal owner user ID" })),
      pipeline_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      pipeline_stage_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      status_id: Type.Optional(Type.Number()),
      companies_branches_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createDeal(params as any));
    },
  });

  api.registerTool({
    name: "kanvas_update_deal",
    label: "Update Deal",
    description: "Update a deal's title, description, pipeline stage, owner, or linked entities.",
    parameters: Type.Object({
      id: Type.String({ description: "Deal ID" }),
      title: Type.Optional(Type.String()),
      description: Type.Optional(Type.String()),
      leads_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      people_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      organization_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      owner_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      pipeline_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      pipeline_stage_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
      status_id: Type.Optional(Type.Number()),
      companies_branches_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updateDeal(id, input as any));
    },
  });

  api.registerTool({
    name: "kanvas_delete_deal",
    label: "Delete Deal",
    description: "Delete a deal by ID.",
    parameters: Type.Object({
      id: Type.String({ description: "Deal ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deleteDeal(params.id));
    },
  });
}
