/** Wraps any service response into the AgentToolResult shape OpenClaw expects. */
export function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    details: data,
  };
}

/** Auth guard type — call before every tool execute to ensure login is complete. */
export type EnsureAuth = () => Promise<void>;
