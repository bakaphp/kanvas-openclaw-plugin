import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { InventoryService } from "../domains/inventory/index.js";
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

export function registerInventoryTools(api: OpenClawPluginApi, service: InventoryService, ensureAuth: EnsureAuth) {
  api.registerTool({
    name: "kanvas_search_products",
    label: "Search Products",
    description: "Search products by keyword in the Kanvas inventory.",
    parameters: Type.Object({
      search: Type.String({ description: "Search keyword" }),
      first: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.searchProducts(params.search, params.first));
    },
  });

  api.registerTool({
    name: "kanvas_get_product",
    label: "Get Product",
    description: "Get full details for a product by ID, including variants and warehouses.",
    parameters: Type.Object({
      id: Type.String({ description: "Product ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getProduct(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_list_variants",
    label: "List Variants",
    description: "List product variants with optional filtering.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listVariants(params.first, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_warehouses",
    label: "List Warehouses",
    description: "List warehouses with optional filtering.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listWarehouses(params.first, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_channels",
    label: "List Sales Channels",
    description: "List sales channels with optional filtering.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listChannels(params.first, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_categories",
    label: "List Categories",
    description: "List product categories with optional filtering.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listCategories(params.first, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_inventory_statuses",
    label: "List Inventory Statuses",
    description: "List inventory statuses with optional filtering.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listStatuses(params.first, params.where as any));
    },
  });
}
