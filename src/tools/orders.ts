import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OrdersService } from "../domains/orders/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

export function registerOrdersTools(api: OpenClawPluginApi, service: OrdersService, ensureAuth: EnsureAuth) {
  api.registerTool({
    name: "kanvas_search_orders",
    label: "Search Orders",
    description: "Search orders by keyword.",
    parameters: Type.Object({
      search: Type.String({ description: "Search keyword" }),
      first: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.searchOrders(params.search, params.first));
    },
  });

  api.registerTool({
    name: "kanvas_get_order",
    label: "Get Order",
    description: "Get full details for an order by ID, including items and customer info.",
    parameters: Type.Object({
      id: Type.String({ description: "Order ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.getOrder(params.id));
    },
  });
}
