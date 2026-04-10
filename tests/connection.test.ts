import { describe, it, expect, beforeAll } from "vitest";
import { KanvasClient } from "../src/client/kanvas-client.js";
import { getAuthenticatedClient } from "./setup.js";

let client: KanvasClient;

beforeAll(async () => {
  client = await getAuthenticatedClient();
});

describe("Connection", () => {
  it("testConnection reports ok", async () => {
    const result = await client.testConnection();
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.errors).toHaveLength(0);
  });

  it("client is authenticated with a bearer token", () => {
    const config = client.getConfig();
    expect(config.authMode).toBe("bearer");
    expect(config.bearerToken).toBeDefined();
    expect(config.bearerToken!.length).toBeGreaterThan(0);
  });
});
