import { Type } from "@sinclair/typebox";
import { KanvasClient } from "./client/kanvas-client.js";
import { CrmService } from "./domains/crm/index.js";
import { InventoryService } from "./domains/inventory/index.js";
import { OrdersService } from "./domains/orders/index.js";
import { SocialService } from "./domains/social/index.js";
import { registerCrmTools } from "./tools/crm.js";
import { registerInventoryTools } from "./tools/inventory.js";
import { registerOrdersTools } from "./tools/orders.js";
import { registerSocialTools } from "./tools/social.js";
import { toolResult } from "./tools/helpers.js";
import type { KanvasConfig } from "./config/types.js";

const DEFAULT_API_URL = "https://graphapi.kanvas.dev/graphql";

function resolveConfig(pluginConfig?: Record<string, unknown>): KanvasConfig {
  const cfg = pluginConfig ?? {};
  const apiUrl = (cfg.apiUrl as string) || process.env.KANVAS_API_URL || DEFAULT_API_URL;
  const xKanvasApp = (cfg.xKanvasApp as string) || process.env.KANVAS_X_APP;

  if (!xKanvasApp) throw new Error("Kanvas plugin: xKanvasApp is required (config or KANVAS_X_APP env)");

  const email = (cfg.email as string) || process.env.KANVAS_EMAIL;
  const password = (cfg.password as string) || process.env.KANVAS_PASSWORD;
  const bearerToken = (cfg.bearerToken as string) || process.env.KANVAS_BEARER_TOKEN;
  const xKanvasKey = (cfg.xKanvasKey as string) || process.env.KANVAS_X_KEY;

  // Determine auth mode: email/password → bearer (after login), explicit bearer, or app-key
  let authMode: KanvasConfig["authMode"];
  if (email && password) {
    authMode = "bearer"; // will authenticate at first use
  } else {
    authMode = ((cfg.authMode as string) || process.env.KANVAS_AUTH_MODE || "bearer") as KanvasConfig["authMode"];
  }

  return {
    apiUrl,
    xKanvasApp,
    xKanvasLocation: (cfg.xKanvasLocation as string) || process.env.KANVAS_X_LOCATION,
    authMode,
    bearerToken,
    xKanvasKey,
    email,
    password,
    timeoutMs: (cfg.timeoutMs as number) || (process.env.KANVAS_TIMEOUT_MS ? Number(process.env.KANVAS_TIMEOUT_MS) : 15000),
  };
}

/**
 * Creates a guard that ensures the client is authenticated before any tool executes.
 * If email/password are configured, logs in once and caches the session.
 * If a bearer token is already set, does nothing.
 */
function createAuthGuard(client: KanvasClient, config: KanvasConfig, logger: { info: (msg: string) => void }) {
  let authPromise: Promise<void> | null = null;

  return function ensureAuth(): Promise<void> {
    if (authPromise) return authPromise;

    if (config.email && config.password && !config.bearerToken) {
      authPromise = client.login(config.email, config.password).then((session) => {
        logger.info(`Kanvas: authenticated as user ${session.uuid}`);
      });
    } else {
      authPromise = Promise.resolve();
    }

    return authPromise;
  };
}

export default {
  id: "kanvas",
  name: "Kanvas CRM",
  description: "Connects agents to Kanvas — your company's nervous system for CRM, inventory, orders, and messaging.",
  configSchema: { type: "object" as const },

  register(api: any) {
    // Guard: resolve config and log a warning instead of throwing if
    // credentials are missing. This prevents the gateway from entering
    // an infinite retry loop when the plugin is installed but not yet
    // configured, or when the gateway re-invokes register() multiple times.
    let config: KanvasConfig;
    try {
      config = resolveConfig(api.pluginConfig);
    } catch (err: any) {
      api.logger.info(`Kanvas plugin skipped: ${err.message}. Run "openclaw kanvas setup" to configure.`);

      // Still register the CLI so the user can run setup even without config
      api.registerCli(
        (ctx: any) => {
          ctx.program
            .command("setup")
            .description("Interactive setup — configure Kanvas credentials and test the connection")
            .action(async () => {
              const { runSetup } = await import("./cli/setup.js");
              await runSetup();
            });
        },
        { commands: ["setup"] }
      );
      return;
    }

    const client = new KanvasClient(config);
    const ensureAuth = createAuthGuard(client, config, api.logger);

    const crm = new CrmService(client);
    const inventory = new InventoryService(client);
    const orders = new OrdersService(client);
    const social = new SocialService(client);

    registerCrmTools(api, crm, ensureAuth);
    registerInventoryTools(api, inventory, ensureAuth);
    registerOrdersTools(api, orders, ensureAuth);
    registerSocialTools(api, social, ensureAuth);

    api.registerTool({
      name: "kanvas_test_connection",
      label: "Test Connection",
      description: "Test the connection to the Kanvas GraphQL API.",
      parameters: Type.Object({}),
      async execute() {
        await ensureAuth();
        return toolResult(await client.testConnection());
      },
    });

    // Inject Kanvas context into the agent's system prompt so it knows
    // what these tools are for and how to use them together.
    api.on("before_prompt_build", () => ({
      appendSystemContext: KANVAS_SYSTEM_CONTEXT,
    }));

    // Register `openclaw kanvas setup` CLI command for interactive configuration.
    api.registerCli(
      (ctx: any) => {
        ctx.program
          .command("setup")
          .description("Interactive setup — configure Kanvas credentials and test the connection")
          .action(async () => {
            const { runSetup } = await import("./cli/setup.js");
            await runSetup();
          });
      },
      { commands: ["setup"] }
    );

    api.logger.info("Kanvas plugin registered — 53 tools loaded");
  },
};

const KANVAS_SYSTEM_CONTEXT = `
## Kanvas Plugin

You have access to Kanvas — the company's nervous system. Kanvas is the operational engine that connects all business data, tools, and workflows. Through the \`kanvas_*\` tools you can directly operate on CRM, inventory, orders, and messaging. Don't just describe what you'd do — use these tools to actually do it.

### Domains & When to Use

**CRM (Leads)**
Use when the user asks about leads, prospects, sales pipeline, contacts, or follow-ups.
- \`kanvas_search_leads\` → find leads by name, email, or keyword
- \`kanvas_get_lead\` → full lead detail (pipeline stage, owner, receiver, participants, files, events, messages)
- \`kanvas_create_lead\` → new lead (requires: title, pipeline_stage_id, people with firstname/lastname)
- \`kanvas_update_lead\` → edit lead fields (requires: id, branch_id, people_id)
- \`kanvas_mark_lead_outcome\` → close a lead as Won, Lost, or Close
- \`kanvas_change_lead_owner\` / \`kanvas_change_lead_receiver\` → reassign leads
- \`kanvas_add_lead_participant\` / \`kanvas_remove_lead_participant\` → manage related people
- \`kanvas_follow_lead\` / \`kanvas_unfollow_lead\` → subscribe to lead updates
- \`kanvas_delete_lead\` / \`kanvas_restore_lead\` → soft-delete and restore
- \`kanvas_attach_file_to_lead_by_url\` → attach a file to a lead from a public URL
- \`kanvas_upload_file_to_lead\` → upload a file directly to a lead (base64-encoded content — for PDFs, images, generated docs)
- \`kanvas_upload_file_to_message\` → upload a file to a message (base64-encoded)

**People / Contacts**
Use when the user asks about updating contact info, adding phone numbers or emails.
- \`kanvas_search_people\` → search contacts by name, email, or phone
- \`kanvas_update_people\` → update a person's name, phone, email, address, tags (call kanvas_list_contact_types first for contact type IDs)
- \`kanvas_list_contact_types\` → get valid contact type IDs (email, phone, etc.)
- \`kanvas_list_people_relationships\` → list relationship types for lead participants

**CRM Support Data** — call these first when creating/updating leads to get valid IDs:
- \`kanvas_list_pipelines\` → pipelines and their stages (needed for pipeline_stage_id)
- \`kanvas_list_lead_statuses\` → available statuses
- \`kanvas_list_lead_sources\` → where leads come from
- \`kanvas_list_lead_types\` → lead categories

**Messages & Notes**
Use when the user asks about notes, comments, conversations, or activity on a lead.
- \`kanvas_add_lead_message\` → add a note to a lead channel (needs channel_slug)
- \`kanvas_add_lead_note_by_lead_id\` → add a note by lead ID (auto-resolves channel)
- \`kanvas_list_lead_messages\` → read conversation history for a lead channel
- \`kanvas_get_lead_primary_channel_slug\` → find the main channel for a lead

**Social / Messages (NoSQL-like storage)**
Use when the user wants to store, query, or manage structured data as messages. The message field accepts any JSON.
- \`kanvas_create_message\` → store any JSON document with a message_verb type and optional channel/entity linking
- \`kanvas_get_message\` → retrieve a message with all metadata
- \`kanvas_update_message\` → modify message content or metadata
- \`kanvas_delete_message\` → soft-delete
- \`kanvas_list_channel_messages\` → list messages in a channel
- \`kanvas_search_messages\` → search/filter by type (verb), channel, or linked entity
- \`kanvas_list_message_types\` → see available message verbs
- \`kanvas_create_message_type\` → define a new verb with optional template

**Email**
- \`kanvas_send_anonymous_email\` → send email to any address using a template (no Kanvas account needed for recipient)

**Inventory**
Use when the user asks about products, stock, warehouses, or catalog.
- \`kanvas_search_products\` → find products by keyword
- \`kanvas_get_product\` → full product detail with variants, categories, warehouses
- \`kanvas_list_variants\` → product variants with pricing, stock, attributes
- \`kanvas_list_warehouses\` → stock locations
- \`kanvas_list_channels\` → sales channels
- \`kanvas_list_categories\` → product categories
- \`kanvas_list_inventory_statuses\` → product statuses

**Orders**
Use when the user asks about orders, purchases, or sales.
- \`kanvas_search_orders\` → find orders by number or keyword
- \`kanvas_get_order\` → full order detail with items, customer, status

**Follow-ups & Reminders**
ALWAYS schedule follow-ups in Kanvas so the human team can see them — NEVER store them only in local memory.
- \`kanvas_create_follow_up\` → create a calendar event for a future action (e.g. "Call Jane re: proposal"). Optionally link to a lead. Requires: name, date, start_time, end_time.
- \`kanvas_list_events\` → list scheduled events/follow-ups
- For structured follow-up data (tracking status, priority, custom fields), use \`kanvas_create_message\` with verb "follow_up" and a JSON payload containing { due_date, lead_id, action, status, priority }.

**Diagnostics**
- \`kanvas_test_connection\` → verify the API is reachable

### Key Conventions
- IDs are numeric strings. When a tool returns an ID, use it as-is in subsequent calls.
- Leads live in pipelines with stages. Always check \`kanvas_list_pipelines\` to get valid stage IDs before creating leads.
- Messages use \`message_verb\` to define their type (e.g. "comment", "note", "sms"). New verbs are auto-created.
- The \`message\` field in social messages accepts arbitrary JSON — use it to store any structured data.
- Filtering uses \`where: { column, operator, value }\` format. Common operators: "EQ", "LIKE", "IN".
- **Follow-ups and reminders MUST go in Kanvas** (events or messages), not local memory. The human team needs to see them in the dashboard.
- When updating a lead, you don't need to provide branch_id or people_id — they are auto-fetched.
- To add contacts to a person, call \`kanvas_list_contact_types\` first, then pass the contacts array to \`kanvas_update_people\`.
`.trim();

