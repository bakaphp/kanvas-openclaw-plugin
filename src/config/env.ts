import { KanvasConfig } from "./types.js";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): KanvasConfig {
  const authMode = (env.KANVAS_AUTH_MODE ?? "bearer") as KanvasConfig["authMode"];

  return {
    apiUrl: required("KANVAS_API_URL", env.KANVAS_API_URL),
    xKanvasApp: required("KANVAS_X_APP", env.KANVAS_X_APP),
    xKanvasLocation: env.KANVAS_X_LOCATION,
    authMode,
    bearerToken: env.KANVAS_BEARER_TOKEN,
    xKanvasKey: env.KANVAS_X_KEY,
    timeoutMs: env.KANVAS_TIMEOUT_MS ? Number(env.KANVAS_TIMEOUT_MS) : 15000,
  };
}
