import { describe, it, expect, beforeAll } from "vitest";
import { InventoryService } from "../src/domains/inventory/index.js";
import { getAuthenticatedClient } from "./setup.js";

let inventory: InventoryService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  inventory = new InventoryService(client);
});

describe("Inventory — Products", () => {
  let productId: string;

  it("searchProducts returns paginated results", async () => {
    const res = await inventory.searchProducts("test", 5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const products = (res.data as any).products.data;
    expect(Array.isArray(products)).toBe(true);

    if (products.length > 0) {
      productId = products[0].id;
    }
  });

  it("getProduct returns full details", async () => {
    if (!productId) return; // skip if no products in dev env

    const res = await inventory.getProduct(productId);
    expect(res.errors).toBeFalsy();

    const products = (res.data as any).products.data;
    expect(products.length).toBe(1);
    expect(products[0].id).toBe(productId);
  });
});

describe("Inventory — Lists", () => {
  it("listVariants returns paginated results", async () => {
    const res = await inventory.listVariants(5);
    expect(res.errors).toBeFalsy();

    const variants = (res.data as any).variants.data;
    expect(Array.isArray(variants)).toBe(true);
  });

  it("listWarehouses returns data", async () => {
    const res = await inventory.listWarehouses(5);
    expect(res.errors).toBeFalsy();

    const warehouses = (res.data as any).warehouses.data;
    expect(Array.isArray(warehouses)).toBe(true);
  });

  it("listChannels returns data", async () => {
    const res = await inventory.listChannels(5);
    expect(res.errors).toBeFalsy();

    const channels = (res.data as any).channels.data;
    expect(Array.isArray(channels)).toBe(true);
  });

  it("listCategories returns data", async () => {
    const res = await inventory.listCategories(5);
    expect(res.errors).toBeFalsy();

    const categories = (res.data as any).categories.data;
    expect(Array.isArray(categories)).toBe(true);
  });

  it("listStatuses returns data", async () => {
    const res = await inventory.listStatuses(5);
    // May be unauthorized depending on user permissions
    if (res.errors?.length) {
      expect(res.errors[0].message).toContain("unauthorized");
      return;
    }

    const statuses = (res.data as any).status.data;
    expect(Array.isArray(statuses)).toBe(true);
  });
});
