import { KanvasConfig, RequestContextOverride } from "../config/types.js";

export function buildKanvasHeaders(
  config: KanvasConfig,
  override: RequestContextOverride = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Kanvas-App": config.xKanvasApp,
  };

  const location = override.xKanvasLocation ?? config.xKanvasLocation;
  if (location) {
    headers["X-Kanvas-Location"] = location;
  }

  if (config.authMode === "bearer") {
    const token = override.bearerToken ?? config.bearerToken;
    if (!token) {
      throw new Error("Bearer auth mode selected but no bearer token is configured");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  if (config.authMode === "app-key") {
    const appKey = override.xKanvasKey ?? config.xKanvasKey;
    if (!appKey) {
      throw new Error("App-key auth mode selected but no X-Kanvas-Key is configured");
    }

    headers["X-Kanvas-Key"] = appKey;
  }

  return headers;
}
