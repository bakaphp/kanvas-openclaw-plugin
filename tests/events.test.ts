import { describe, it, expect, beforeAll } from "vitest";
import { EventsService } from "../src/domains/events/index.js";
import { getAuthenticatedClient } from "./setup.js";

let events: EventsService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  events = new EventsService(client);
});

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

describe("Events — Read", () => {
  it("listEvents returns paginated results", async () => {
    const res = await events.listEvents(5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const list = (res.data as any).events.data;
    expect(Array.isArray(list)).toBe(true);
  });
});

describe("Events — CRUD", () => {
  let createdEventId: string | null = null;

  it("createEvent succeeds with a single date", async () => {
    const res = await events.createEvent({
      name: `Integration Event ${Date.now()}`,
      description: "Created by integration test",
      dates: [
        {
          date: tomorrow(),
          start_time: "10:00",
          end_time: "11:00",
        },
      ],
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const ev = (res.data as any).createEvent;
    expect(ev.id).toBeDefined();
    expect(ev.uuid).toBeDefined();
    expect(ev.name).toBeDefined();
    createdEventId = ev.id;
  });

  it("getEvent returns full detail", async () => {
    if (!createdEventId) return;

    const res = await events.getEvent(createdEventId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    const list = (res.data as any).events.data;
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(createdEventId);
  });

  it("updateEvent modifies fields", async () => {
    if (!createdEventId) return;

    const res = await events.updateEvent(createdEventId, {
      description: "Updated by integration test",
    });

    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }

    const ev = (res.data as any).updateEvent;
    expect(ev.id).toBe(createdEventId);
  });

  it("deleteEvent cleans up", async () => {
    if (!createdEventId) return;

    const res = await events.deleteEvent(createdEventId);
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
      return;
    }
    expect((res.data as any).deleteEvent).toBeTruthy();
  });
});
