# Kanvas OpenClaw Plugin

OpenClaw plugin that connects AI agents to [Kanvas](https://kanvas.dev) — your company's nervous system. Kanvas is the operational engine that connects all your data, tools, and workflows. For AI agents, it's what lets them actually run your business — not just talk about it.

This plugin gives agents direct access to CRM, inventory, orders, and messaging — 53 tools with auto-login, built-in system prompt context, and domain-specific skills.

## Quick Start

### 1. Install the plugin

```bash
openclaw plugins install @kanvas/openclaw-plugin
```

### 2. Update to latest version

```bash
openclaw plugins update kanvas
```

### 3. Configure credentials

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

The API URL is preconfigured. The plugin authenticates automatically on the first tool call using the Kanvas login mutation.

## Skills

The plugin ships with domain-specific **skills** — operational playbooks that teach the agent best practices for each use case. Skills are auto-loaded when the kanvas plugin is configured.

### Included Skills

| Skill | Description |
|-------|-------------|
| `kanvas-crm` | CRM operations — lead management, pipelines, email templates, follow-ups, file attachments, contact updates, participant relationships, email logging, and context isolation rules |

Skills live in `skills/<skill-name>/SKILL.md` and follow the [OpenClaw skills format](https://docs.openclaw.ai/tools/skills). They inject operational guidance into the agent's context automatically.

## Agent Setup Guides

The `agent-setup/` directory contains step-by-step runbooks for deploying specific agent types. These are **human-facing documentation** — not auto-loaded by the agent.

| Guide | Description |
|-------|-------------|
| [Sales Agent](agent-setup/sales.md) | Full setup protocol for an autonomous sales/deal architect agent — persona config, CRM customization, pipeline stages, daily heartbeat, email integration, and anti-pollution rules |

### Agent types you can build with this plugin

**Sales / Deal Architect**
Autonomous lead generation, cold outreach, pipeline management, follow-up scheduling, and daily reporting. See [agent-setup/sales.md](agent-setup/sales.md) for the full setup protocol.

**Operations Agent**
Inventory monitoring, order tracking, stock alerts, and cross-domain reporting.

**Customer Success Agent**
Post-sale follow-ups, onboarding workflows, satisfaction tracking via CRM notes and events.

**Data Entry / Admin Agent**
Bulk lead import, contact enrichment, file attachments, and CRM hygiene.

Each agent type uses the same plugin and tools — the difference is the system prompt, skills, and heartbeat configuration.

### Setting up the agent's system prompt

The plugin injects tool documentation automatically. But the agent's **base system prompt** (configured in OpenClaw) should define its role. Example for a sales agent:

```
You are a sales and operations agent for [Company Name]. You manage leads,
inventory, and orders using the CRM.

Your responsibilities:
- Register and manage leads in the CRM pipeline
- Send outreach emails and follow up with prospects
- Log all activity as CRM notes and messages
- Schedule follow-ups as calendar events (never in local memory)
- Send daily pipeline summaries to the team

When users ask you to do any of these things, use the kanvas_* tools to act
on it directly. Don't just describe what you would do — actually do it.
```

## Tools Reference

### CRM (29 tools)

| Tool | Description |
|------|-------------|
| `kanvas_search_leads` | Search leads by keyword |
| `kanvas_get_lead` | Full lead detail (pipeline, owner, participants, files, events) |
| `kanvas_create_lead` | Create a new lead |
| `kanvas_update_lead` | Update lead fields (auto-fetches branch_id/people_id) |
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
| `kanvas_attach_file_to_lead_by_url` | Attach file from a public URL |
| `kanvas_upload_file_to_lead` | Upload file (base64, file path, or URL) |
| `kanvas_upload_file_to_message` | Upload file to a message |
| `kanvas_search_people` | Search contacts by name, email, or phone |
| `kanvas_update_people` | Update contact info (phone, email, address, tags) |
| `kanvas_list_contact_types` | List contact types (email, phone, etc.) |
| `kanvas_list_people_relationships` | List relationship types |
| `kanvas_create_people_relationship` | Create a relationship type |
| `kanvas_update_people_relationship` | Update a relationship type |
| `kanvas_delete_people_relationship` | Delete a relationship type |
| `kanvas_create_follow_up` | Schedule a follow-up event linked to a lead |
| `kanvas_list_events` | List scheduled events/follow-ups |
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
| `apiUrl` | No | Preconfigured | GraphQL endpoint (override only if self-hosting) |
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

MIT
