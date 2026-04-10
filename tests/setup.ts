import { KanvasClient } from "../src/client/kanvas-client.js";
import type { KanvasConfig } from "../src/config/types.js";

/**
 * Reads test credentials from environment variables.
 * Required: KANVAS_API_URL, KANVAS_X_APP, KANVAS_EMAIL, KANVAS_PASSWORD
 * Optional: KANVAS_X_LOCATION
 */
function getTestConfig(): KanvasConfig {
  const apiUrl = process.env.KANVAS_API_URL;
  const xKanvasApp = process.env.KANVAS_X_APP;
  const email = process.env.KANVAS_EMAIL;
  const password = process.env.KANVAS_PASSWORD;

  if (!apiUrl || !xKanvasApp || !email || !password) {
    throw new Error(
      "Integration tests require env vars: KANVAS_API_URL, KANVAS_X_APP, KANVAS_EMAIL, KANVAS_PASSWORD\n" +
        "Create a .env.test file or export them before running tests."
    );
  }

  return {
    apiUrl,
    xKanvasApp,
    xKanvasLocation: process.env.KANVAS_X_LOCATION,
    authMode: "bearer",
    email,
    password,
    timeoutMs: 30_000,
  };
}

let clientSingleton: KanvasClient | null = null;

/**
 * Returns an authenticated KanvasClient, logging in once and reusing the token.
 */
export async function getAuthenticatedClient(): Promise<KanvasClient> {
  if (clientSingleton) return clientSingleton;

  const config = getTestConfig();
  const client = new KanvasClient(config);
  await client.login(config.email!, config.password!);

  clientSingleton = client;
  return client;
}
