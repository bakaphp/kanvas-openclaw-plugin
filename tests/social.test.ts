import { describe, it, expect, beforeAll } from "vitest";
import { SocialService } from "../src/domains/social/index.js";
import { getAuthenticatedClient } from "./setup.js";

let social: SocialService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  social = new SocialService(client);
});

describe("Social — Messages CRUD", () => {
  let messageId: string;

  it("createMessage succeeds", async () => {
    const res = await social.createMessage({
      message_verb: "integration-test",
      message: { text: "Hello from integration test", timestamp: Date.now() },
    });
    expect(res.errors).toBeFalsy();

    const msg = (res.data as any).createMessage;
    expect(msg.id).toBeDefined();
    expect(msg.uuid).toBeDefined();
    expect(msg.tags).toBeDefined();
    // tags should be a paginator with data array
    expect(msg.tags.data).toBeDefined();
    expect(Array.isArray(msg.tags.data)).toBe(true);
    messageId = msg.id;
  });

  it("getMessage returns the created message", async () => {
    const res = await social.getMessage(messageId);
    expect(res.errors).toBeFalsy();

    const messages = (res.data as any).messages.data;
    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe(messageId);
    // validate tags paginator structure
    expect(messages[0].tags.data).toBeDefined();
    expect(Array.isArray(messages[0].tags.data)).toBe(true);
  });

  it("updateMessage modifies fields", async () => {
    const res = await social.updateMessage(messageId, {
      message: { text: "Updated by integration test", updated: true },
    });
    expect(res.errors).toBeFalsy();

    const msg = (res.data as any).updateMessage;
    expect(msg.id).toBe(messageId);
    // validate tags paginator structure
    expect(msg.tags.data).toBeDefined();
  });

  it("deleteMessage removes the message", async () => {
    const res = await social.deleteMessage(messageId);
    expect(res.errors).toBeFalsy();
    expect((res.data as any).deleteMessage).toBeTruthy();
  });
});

describe("Social — Search & Channel Messages", () => {
  it("searchMessages returns paginated results", async () => {
    const res = await social.searchMessages(undefined, 5);
    expect(res.errors).toBeFalsy();

    const data = (res.data as any).messages;
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.paginatorInfo).toBeDefined();

    // validate tags paginator on results if any exist
    if (data.data.length > 0) {
      expect(data.data[0].tags.data).toBeDefined();
    }
  });
});

describe("Social — Message Types", () => {
  it("listMessageTypes returns data", async () => {
    const res = await social.listMessageTypes();
    expect(res.errors).toBeFalsy();

    const types = (res.data as any).messageTypes.data;
    expect(Array.isArray(types)).toBe(true);
  });

  it("createMessageType succeeds", async () => {
    const verb = `int-test-${Date.now()}`;
    const res = await social.createMessageType({
      languages_id: 1,
      name: `Integration Test Type`,
      verb,
    });
    expect(res.errors).toBeFalsy();

    const type = (res.data as any).createMessageType;
    expect(type.id).toBeDefined();
    expect(type.verb).toBe(verb);
  });
});
