import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OrdersService } from "../domains/orders/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

const OrderLineItemInput = Type.Object({
  variant_id: Type.Union([Type.String(), Type.Number()], { description: "Variant ID" }),
  quantity: Type.Number({ description: "Quantity" }),
  price: Type.Optional(Type.Union([Type.String(), Type.Number()])),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  channel_id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
});

const OrderAddressInput = Type.Object({
  address: Type.String(),
  address_2: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  state: Type.Optional(Type.String()),
  zip: Type.Optional(Type.String()),
  country: Type.Optional(Type.String()),
  is_default: Type.Optional(Type.Boolean()),
});

const OrderBillingInput = Type.Object({
  address: Type.String(),
  address2: Type.Optional(Type.String()),
  city: Type.String(),
  state: Type.String(),
  zip: Type.String(),
  country: Type.String(),
});

const OrderCustomerInput = Type.Object({
  id: Type.Optional(Type.Union([Type.String(), Type.Number()])),
  firstname: Type.String(),
  lastname: Type.Optional(Type.String()),
  contacts: Type.Optional(
    Type.Array(
      Type.Object({
        value: Type.String(),
        contacts_types_id: Type.Number(),
        weight: Type.Optional(Type.Number()),
      })
    )
  ),
  address: Type.Optional(Type.Array(OrderAddressInput)),
});

export function registerOrdersTools(api: OpenClawPluginApi, service: OrdersService, ensureAuth: EnsureAuth) {

  // ── Read ───────────────────────────────────────────────────

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

  // ── Lookups ────────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_list_order_statuses",
    label: "List Order Statuses",
    description: "List order statuses. Use to find status slugs for status transitions.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listOrderStatuses(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_list_order_types",
    label: "List Order Types",
    description: "List order types (e.g. standard, subscription). Each type has its own status pipeline.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listOrderTypes(params.first));
    },
  });

  api.registerTool({
    name: "kanvas_list_regions",
    label: "List Regions",
    description: "List regions for order creation. Regions define currency and tax rules.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listRegions(params.first));
    },
  });

  // ── Write ──────────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_create_draft_order",
    label: "Create Draft Order",
    description: "Create a draft order. Requires email, customer (firstname), region_id, and at least one item with variant_id+quantity. Use kanvas_list_regions to get a region ID and kanvas_list_variants to find variants.",
    parameters: Type.Object({
      email: Type.String({ description: "Customer email" }),
      phone: Type.Optional(Type.String()),
      customer: OrderCustomerInput,
      region_id: Type.Union([Type.String(), Type.Number()], { description: "Region ID (use kanvas_list_regions)" }),
      items: Type.Array(OrderLineItemInput, { description: "Line items" }),
      channel_id: Type.Optional(Type.Union([Type.String(), Type.Number()], { description: "Channel ID" })),
      billing_address: Type.Optional(OrderBillingInput),
      shipping_address: Type.Optional(OrderAddressInput),
      note: Type.Optional(Type.String()),
      metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.createDraftOrder(params as any));
    },
  });

  api.registerTool({
    name: "kanvas_update_order",
    label: "Update Order",
    description: "Update an order's items, fulfillment status, payment status, or metadata.",
    parameters: Type.Object({
      id: Type.String({ description: "Order ID" }),
      items: Type.Optional(Type.Array(OrderLineItemInput)),
      fulfillment_status: Type.Optional(Type.String()),
      status: Type.Optional(Type.String()),
      payment_status: Type.Optional(Type.String()),
      metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      metadata_action: Type.Optional(Type.Union([Type.Literal("MERGE"), Type.Literal("REPLACE")])),
    }),
    async execute(_id, params) {
      await ensureAuth();
      const { id, ...input } = params;
      return toolResult(await service.updateOrder(id, input as any));
    },
  });

  api.registerTool({
    name: "kanvas_update_draft_order_status",
    label: "Update Draft Order Status",
    description: "Change a draft order's status (PENDING, COMPLETED, DRAFT, CANCELED, FAILED).",
    parameters: Type.Object({
      order_id: Type.String({ description: "Order ID" }),
      status: Type.Union(
        [
          Type.Literal("PENDING"),
          Type.Literal("COMPLETED"),
          Type.Literal("DRAFT"),
          Type.Literal("CANCELED"),
          Type.Literal("FAILED"),
        ],
        { description: "New status" }
      ),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.updateDraftOrderStatus(params.order_id, params.status));
    },
  });

  api.registerTool({
    name: "kanvas_transition_order_status",
    label: "Transition Order Status",
    description: "Move an order through its status pipeline using a status slug (from kanvas_list_order_statuses).",
    parameters: Type.Object({
      order_id: Type.String({ description: "Order ID" }),
      status_slug: Type.Optional(Type.String({ description: "Target status slug" })),
      date: Type.Optional(Type.String({ description: "Transition date" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.transitionOrderStatus(params.order_id, params.status_slug, params.date));
    },
  });

  api.registerTool({
    name: "kanvas_order_change_customer",
    label: "Change Order Customer",
    description: "Change the customer on an order. Requires xKanvasKey (app-key authenticated).",
    parameters: Type.Object({
      order_id: Type.String({ description: "Order ID" }),
      customer_id: Type.String({ description: "New customer ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.changeOrderCustomer(params.order_id, params.customer_id));
    },
  });

  api.registerTool({
    name: "kanvas_delete_order",
    label: "Delete Order",
    description: "Delete an order.",
    parameters: Type.Object({
      id: Type.String({ description: "Order ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.deleteOrder(params.id));
    },
  });

  api.registerTool({
    name: "kanvas_send_order_email",
    label: "Send Order Email",
    description: "Send an email for an order (confirmation, receipt, etc.). Requires xKanvasKey (app-key authenticated).",
    parameters: Type.Object({
      order_id: Type.String({ description: "Order ID" }),
      template: Type.Optional(Type.String({ description: "Email template name" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.sendOrderEmail(params.order_id, params.template));
    },
  });
}
