import { KanvasConfig, LoginResponse, RequestContextOverride } from "../config/types.js";
import { buildKanvasHeaders } from "./headers.js";
import { ConnectionTestResult, GraphQLResponse } from "./types.js";

export class KanvasClient {
  private config: KanvasConfig;

  constructor(config: KanvasConfig) {
    this.config = config;
  }

  getConfig(): KanvasConfig {
    return this.config;
  }

  /**
   * Authenticate with email/password and store the bearer token.
   * The login mutation is public (no @guard), only needs X-Kanvas-App.
   */
  async login(email: string, password: string): Promise<LoginResponse["login"]> {
    const mutation = `
      mutation Login($data: LoginInput!) {
        login(data: $data) {
          id
          uuid
          token
          refresh_token
          token_expires
          refresh_token_expires
          time
          timezone
          sessionId
        }
      }
    `;

    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kanvas-App": this.config.xKanvasApp,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { data: { email, password } },
      }),
    });

    const payload = (await response.json()) as GraphQLResponse<LoginResponse>;

    if (payload.errors?.length) {
      throw new Error(`Kanvas login failed: ${payload.errors.map((e) => e.message).join(", ")}`);
    }

    if (!payload.data?.login?.token) {
      throw new Error("Kanvas login failed: no token returned");
    }

    this.config = {
      ...this.config,
      authMode: "bearer",
      bearerToken: payload.data.login.token,
    };

    return payload.data.login;
  }

  /**
   * Execute a query using X-Kanvas-Key auth (for @guardByAppKey mutations).
   * Requires xKanvasKey to be configured.
   */
  async queryWithAppKey<TData>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<GraphQLResponse<TData>> {
    const appKey = this.config.xKanvasKey;
    if (!appKey) {
      throw new Error("xKanvasKey is required for this operation (app-key authenticated mutation)");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Kanvas-App": this.config.xKanvasApp,
      "X-Kanvas-Key": appKey,
    };

    const location = this.config.xKanvasLocation;
    if (location) {
      headers["X-Kanvas-Location"] = location;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 15000);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      return (await response.json()) as GraphQLResponse<TData>;
    } finally {
      clearTimeout(timeout);
    }
  }

  async query<TData>(
    query: string,
    variables: Record<string, unknown> = {},
    override: RequestContextOverride = {}
  ): Promise<GraphQLResponse<TData>> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? 15000
    );

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: buildKanvasHeaders(this.config, override),
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      return (await response.json()) as GraphQLResponse<TData>;
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(
    override: RequestContextOverride = {}
  ): Promise<ConnectionTestResult> {
    const query = `query PluginConnectionTest { __typename }`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? 15000
    );

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: buildKanvasHeaders(this.config, override),
        body: JSON.stringify({ query, variables: {} }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as GraphQLResponse<{ __typename: string }>;

      return {
        ok: response.ok && !payload.errors?.length,
        status: response.status,
        endpoint: this.config.apiUrl,
        hasData: Boolean(payload.data),
        errors: payload.errors?.map((error) => error.message) ?? [],
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        endpoint: this.config.apiUrl,
        hasData: false,
        errors: [error instanceof Error ? error.message : "Unknown connection error"],
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
