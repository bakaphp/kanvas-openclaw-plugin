import { describe, it, expect, beforeAll } from "vitest";
import { DealsService } from "../src/domains/deals/index.js";
import { getAuthenticatedClient } from "./setup.js";

let deals: DealsService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  deals = new DealsService(client);
});

describe("Deals — Read", () => {
  it("listDeals returns paginated results", async () => {
    const res = await deals.listDeals(5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const list = (res.data as any).deals.data;
    expect(Array.isArray(list)).toBe(true);
  });

  it("listDeals supports search", async () => {
    const res = await deals.listDeals(5, "test");
    expect(res.errors).toBeFalsy();
    const list = (res.data as any).deals.data;
    expect(Array.isArray(list)).toBe(true);
  });
});

describe("Deals — CRUD", () => {
  let createdDealId: string | null = null;

  it("createDeal succeeds with just a title", async () => {
    const res = await deals.createDeal({
      title: `Integration Deal ${Date.now()}`,
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const deal = (res.data as any).createDeal;
    expect(deal.id).toBeDefined();
    expect(deal.uuid).toBeDefined();
    expect(deal.title).toBeDefined();
    createdDealId = deal.id;
  });

  it("getDeal returns the created deal", async () => {
    if (!createdDealId) return;

    const res = await deals.getDeal(createdDealId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    const deal = (res.data as any).deal;
    expect(deal.id).toBe(createdDealId);
  });

  it("updateDeal modifies fields", async () => {
    if (!createdDealId) return;

    const res = await deals.updateDeal(createdDealId, {
      description: "Updated by integration test",
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const deal = (res.data as any).updateDeal;
    expect(deal.id).toBe(createdDealId);
    expect(deal.description).toBe("Updated by integration test");
  });

  it("deleteDeal cleans up", async () => {
    if (!createdDealId) return;

    const res = await deals.deleteDeal(createdDealId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    expect((res.data as any).deleteDeal).toBeTruthy();
  });
});
