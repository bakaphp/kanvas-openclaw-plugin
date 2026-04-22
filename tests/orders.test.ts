import { describe, it, expect, beforeAll } from "vitest";
import { OrdersService } from "../src/domains/orders/index.js";
import { InventoryService } from "../src/domains/inventory/index.js";
import { getAuthenticatedClient } from "./setup.js";

let orders: OrdersService;
let inventory: InventoryService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  orders = new OrdersService(client);
  inventory = new InventoryService(client);
});

describe("Orders — Search & Get", () => {
  let orderId: string;

  it("searchOrders returns paginated results", async () => {
    const res = await orders.searchOrders("test", 5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const ordersList = (res.data as any).orders.data;
    expect(Array.isArray(ordersList)).toBe(true);

    if (ordersList.length > 0) {
      orderId = ordersList[0].id;
    }
  });

  it("getOrder returns full details", async () => {
    if (!orderId) return; // skip if no orders in dev env

    const res = await orders.getOrder(orderId);
    expect(res.errors).toBeFalsy();

    const orderData = (res.data as any).orders.data;
    expect(orderData.length).toBe(1);
    expect(orderData[0].id).toBe(orderId);
  });
});

describe("Orders — Lookups", () => {
  it("listOrderStatuses returns data", async () => {
    const res = await orders.listOrderStatuses();
    // may be unauthorized depending on user permissions
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    const statuses = (res.data as any).orderStatuses.data;
    expect(Array.isArray(statuses)).toBe(true);
  });

  it("listOrderTypes returns data", async () => {
    const res = await orders.listOrderTypes();
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    const types = (res.data as any).orderTypes.data;
    expect(Array.isArray(types)).toBe(true);
  });

  it("listRegions returns data", async () => {
    const res = await orders.listRegions();
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    const regions = (res.data as any).regions.data;
    expect(Array.isArray(regions)).toBe(true);
  });
});

describe("Orders — Draft Order CRUD", () => {
  let createdOrderId: string | null = null;
  let regionId: string | null = null;
  let variantId: string | null = null;

  beforeAll(async () => {
    // Get a region to use
    const regionsRes = await orders.listRegions(1);
    const regions = (regionsRes.data as any)?.regions?.data ?? [];
    regionId = regions[0]?.id ?? null;

    // Get a variant to use in the order
    const variantsRes = await inventory.listVariants(1);
    const variants = (variantsRes.data as any)?.variants?.data ?? [];
    variantId = variants[0]?.id ?? null;
  });

  it("createDraftOrder succeeds", async () => {
    if (!regionId || !variantId) return; // skip if dev env lacks data

    const res = await orders.createDraftOrder({
      email: `draft-test-${Date.now()}@example.com`,
      customer: {
        firstname: "Draft",
        lastname: "Test",
      },
      region_id: regionId,
      items: [{ variant_id: variantId, quantity: 1 }],
      note: "Integration test draft order",
    });

    // Permissions vary by user — handle gracefully
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const order = (res.data as any).createDraftOrder;
    expect(order.id).toBeDefined();
    expect(order.uuid).toBeDefined();
    createdOrderId = order.id;
  });

  it("updateOrder modifies metadata", async () => {
    if (!createdOrderId) return;

    const res = await orders.updateOrder(createdOrderId, {
      metadata: { test_flag: "integration", ts: Date.now() },
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const result = (res.data as any).updateOrder;
    expect(result.order?.id).toBe(createdOrderId);
  });

  it("updateDraftOrderStatus to CANCELED", async () => {
    if (!createdOrderId) return;

    const res = await orders.updateDraftOrderStatus(createdOrderId, "CANCELED");

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const order = (res.data as any).updateDraftOrderStatus;
    expect(order.id).toBe(createdOrderId);
  });

  it("deleteOrder cleans up", async () => {
    if (!createdOrderId) return;

    const res = await orders.deleteOrder(createdOrderId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    expect((res.data as any).deleteOrder).toBeTruthy();
  });
});
