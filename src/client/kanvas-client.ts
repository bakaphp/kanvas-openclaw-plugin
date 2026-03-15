import { KanvasConfig, RequestContextOverride } from "../config/types.js";
import { buildKanvasHeaders } from "./headers.js";
import { ConnectionTestResult, GraphQLResponse } from "./types.js";

export class KanvasClient {
  constructor(private readonly config: KanvasConfig) {}

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
