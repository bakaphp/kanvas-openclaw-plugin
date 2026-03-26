# Kanvas OpenClaw Plugin

OpenClaw plugin that connects AI agents to [Kanvas](https://kanvas.dev) — your company's nervous system. Kanvas is the operational engine that connects all your data, tools, and workflows. For AI agents, it's what lets them actually run your business — not just talk about it.

This plugin gives agents direct access to CRM, inventory, orders, and messaging so they can search leads, create contacts, check stock, track orders, store structured data, and send emails — all through 41 tools with auto-login and built-in system prompt context.

## Quick Start

### 1. Install the plugin

```bash
# From local directory (development)
openclaw plugins install /path/to/kanvas-openclaw-plugin --link

# From npm (once published)
openclaw plugins install kanvas-openclaw-plugin
```

### 2. Configure credentials

In your OpenClaw config file:

```json5
{
  plugins: {
    entries: {
      "kanvas": {
        enabled: true,
        config: {
          xKanvasApp: "your-app-id",
          email: "agent@yourcompany.com",
          password: "agent-password",
          // Optional:
          // xKanvasKey: "your-app-key"  // needed for kanvas_send_anonymous_email
          // xKanvasLocation: "branch-uuid"
        }
      }
    }
  }
}
```

The API URL defaults to `https://graphapi.kanvas.dev/graphql`. The plugin authenticates automatically on the first tool call using the Kanvas login mutation.

### 3. Set up the agent's system prompt

The plugin injects tool documentation into the agent's context automatically. But the agent's **base system prompt** (configured in OpenClaw) should tell it to use Kanvas. Here's a sample:

```
You are a sales and operations agent for [Company Name]. You manage leads,
inventory, and orders using Kanvas.

Your responsibilities:
- Register and manage leads in the CRM pipeline
- Look up products, stock levels, and pricing
- Check and track orders
- Add notes and messages to leads
- Send emails to customers and prospects

When users ask you to do any of these things, use the kanvas_* tools to act
on it directly. Don't just describe what you would do — actually do it.

Before creating a lead, always check kanvas_list_pipelines to get valid
pipeline stage IDs, and kanvas_list_lead_sources for source IDs.

When you don't have enough information to complete an action (e.g. missing
a required field), ask the user for the missing details before proceeding.
```

Customize this for your business — add your company name, specific workflows, and any domain-specific instructions.

## Tools Reference

### CRM (22 tools)

| Tool | Description |
|------|-------------|
| `kanvas_search_leads` | Search leads by keyword |
| `kanvas_get_lead` | Full lead detail (pipeline, owner, participants, files, events) |
| `kanvas_create_lead` | Create a new lead |
| `kanvas_update_lead` | Update lead fields |
| `kanvas_change_lead_owner` | Reassign lead owner |
| `kanvas_change_lead_receiver` | Reassign lead receiver |
| `kanvas_add_lead_participant` | Add a person to a lead |
| `kanvas_remove_lead_participant` | Remove a person from a lead |
| `kanvas_follow_lead` | Subscribe to lead updates |
| `kanvas_unfollow_lead` | Unsubscribe from lead updates |
| `kanvas_delete_lead` | Soft-delete a lead |
| `kanvas_restore_lead` | Restore a deleted lead |
| `kanvas_mark_lead_outcome` | Mark as Won, Lost, or Close |
| `kanvas_create_lead_appointment` | Create a calendar event for a lead |
| `kanvas_add_lead_message` | Add note to a lead channel |
| `kanvas_add_lead_note_by_lead_id` | Add note by lead ID (auto-resolves channel) |
| `kanvas_list_lead_messages` | List messages in a lead channel |
| `kanvas_get_lead_primary_channel_slug` | Get the main channel slug for a lead |
| `kanvas_list_pipelines` | List pipelines and stages |
| `kanvas_list_lead_statuses` | List lead statuses |
| `kanvas_list_lead_sources` | List lead sources |
| `kanvas_list_lead_types` | List lead types |

### Social / Messages (9 tools)

Messages act as NoSQL-like document storage — the `message` field accepts any JSON structure.

| Tool | Description |
|------|-------------|
| `kanvas_create_message` | Create a message with arbitrary JSON payload |
| `kanvas_get_message` | Get message with metadata, files, children |
| `kanvas_update_message` | Update message content or metadata |
| `kanvas_delete_message` | Soft-delete a message |
| `kanvas_list_channel_messages` | List messages by channel slug |
| `kanvas_search_messages` | Search/filter by type, channel, or entity |
| `kanvas_list_message_types` | List available message verbs |
| `kanvas_create_message_type` | Create a new verb with optional template |
| `kanvas_send_anonymous_email` | Send email via template (requires `xKanvasKey`) |

### Inventory (7 tools)

| Tool | Description |
|------|-------------|
| `kanvas_search_products` | Search products by keyword |
| `kanvas_get_product` | Full product detail with variants and warehouses |
| `kanvas_list_variants` | List variants with pricing and stock |
| `kanvas_list_warehouses` | List stock locations |
| `kanvas_list_channels` | List sales channels |
| `kanvas_list_categories` | List product categories |
| `kanvas_list_inventory_statuses` | List product statuses |

### Orders (2 tools)

| Tool | Description |
|------|-------------|
| `kanvas_search_orders` | Search orders by number or keyword |
| `kanvas_get_order` | Full order detail with items, customer, status |

### Diagnostics (1 tool)

| Tool | Description |
|------|-------------|
| `kanvas_test_connection` | Verify API connectivity |

## Authentication

The plugin supports three auth modes:

| Mode | Config fields | When to use |
|------|--------------|-------------|
| **Email/password** (recommended) | `email`, `password` | Agent logs in like a user. Token cached for the session. |
| **Bearer token** | `bearerToken` | Pre-authenticated service account. |
| **App key** | `authMode: "app-key"`, `xKanvasKey` | App-scoped access. Required for `kanvas_send_anonymous_email`. |

With email/password, the plugin calls the Kanvas `login` mutation on the first tool invocation and caches the bearer token — no hardcoded tokens needed.

## Configuration Reference

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `xKanvasApp` | Yes | — | App/tenant identifier |
| `email` | Yes* | — | Agent user email |
| `password` | Yes* | — | Agent user password |
| `apiUrl` | No | `https://graphapi.kanvas.dev/graphql` | GraphQL endpoint |
| `xKanvasLocation` | No | — | Branch/location UUID |
| `xKanvasKey` | No | — | App key (for anonymous email) |
| `bearerToken` | No | — | Pre-existing token (skips login) |
| `authMode` | No | `bearer` | `bearer` or `app-key` |
| `timeoutMs` | No | `15000` | Request timeout in ms |

*Required when using email/password auth (recommended). Not needed if using `bearerToken` or `app-key` mode.

All fields also fall back to `KANVAS_*` environment variables.

## Development

```bash
npm run build     # Compile TypeScript to dist/
npm run check     # Type-check without emitting
npm run dev       # Watch mode
```

### Smoke Test

Test against the real API:

```bash
KANVAS_X_APP=your-app-id \
KANVAS_EMAIL=your@email.com \
KANVAS_PASSWORD=yourpassword \
  npx ts-node --esm scripts/smoke-test.ts
```

## License

Private — see package.json.
