import { describe, it, expect, beforeAll } from "vitest";
import { OrdersService } from "../src/domains/orders/index.js";
import { getAuthenticatedClient } from "./setup.js";

let orders: OrdersService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  orders = new OrdersService(client);
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
