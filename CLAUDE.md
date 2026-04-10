# CLAUDE.md

## Project Overview

Kanvas OpenClaw Plugin — a native OpenClaw plugin that exposes Kanvas CRM/ERP GraphQL APIs as agent tools. Kanvas (kanvas.dev) is an operational engine for commerce: a backend layer connecting data, tools, and workflows so humans and AI agents can manage business operations from one platform. Target customers include commerce businesses, car dealer groups, and vertical SaaS.

This plugin currently covers four domains: CRM (leads, pipelines, messages, files), Inventory (products, variants, warehouses, channels, categories), Orders, and Social (messages as NoSQL-like JSON storage).

## Tech Stack

- **Runtime**: Node.js >= 20 (native `fetch`, minimal deps)
- **Language**: TypeScript 5.9, ES2022 target, NodeNext modules, strict mode
- **Module system**: ESM (`"type": "module"` in package.json)
- **Plugin SDK**: `openclaw/plugin-sdk` — `definePluginEntry`, `api.registerTool()`
- **Parameter schemas**: `@sinclair/typebox` (`Type.Object`, `Type.String`, etc.)
- **Build output**: `dist/` via `tsc`
- **Backend API**: Laravel 12 + Lighthouse GraphQL (kanvas-ecosystem-api)
- **Admin UI**: Next.js 16 + React 19 + Apollo Client (kanvas-core-admin-v2)

## Commands

```bash
npm run build     # Compile TypeScript to dist/
npm run check     # Type-check without emitting
npm run dev       # Watch mode (ts-node --watch)
npm test          # Run integration tests (requires .env.test)
npm run test:watch # Run tests in watch mode
```

## Project Structure

```
openclaw.plugin.json              # Plugin manifest (id, configSchema, uiHints)
src/
  index.ts                        # definePluginEntry — register(api) callback
  config/
    types.ts                      # KanvasConfig, RequestContextOverride
    env.ts                        # Legacy env loader (still importable)
  client/
    kanvas-client.ts              # GraphQL transport (native fetch + abort timeout)
    headers.ts                    # Multi-tenant auth header builder
    multipart.ts                  # GraphQL multipart file upload
    types.ts                      # GraphQLResponse<T> envelope
  domains/
    crm/
      index.ts                    # CRM service — 30+ methods
      types.ts                    # CRM input/output interfaces
    inventory/
      index.ts                    # Inventory service — 7 read methods
    orders/
      index.ts                    # Orders service — 2 read methods
    social/
      index.ts                    # Social/Messages service — 7 methods
      types.ts                    # Message input/output types
  tools/
    helpers.ts                    # toolResult() — wraps data into AgentToolResult
    crm.ts                        # registerCrmTools(api, service) — 22 tools
    inventory.ts                  # registerInventoryTools(api, service) — 7 tools
    orders.ts                     # registerOrdersTools(api, service) — 2 tools
    social.ts                     # registerSocialTools(api, service) — 9 tools
```

## Plugin Architecture

This is a **tool plugin** using the OpenClaw SDK pattern:

1. **Entry point** (`src/index.ts`): default-exports `definePluginEntry({...})` with a `register(api)` callback
2. **Manifest** (`openclaw.plugin.json`): declares `id: "kanvas"`, JSON Schema `configSchema`, and `uiHints`
3. **Tool registration**: each domain calls `api.registerTool()` with TypeBox `parameters`, `description`, `label`, and `execute`
4. **Tool results**: `execute()` returns `{ content: [{type: "text", text: JSON.stringify(data)}], details: data }`

## Key Patterns

- **Config resolution**: `api.pluginConfig` takes priority, falls back to env vars
- **GraphQL queries are inline** in service methods (co-located, not in separate files)
- **Auth modes**: `bearer` (user-scoped) or `app-key` (app-scoped)
- **Multi-tenancy**: `X-Kanvas-App` header required; optional `X-Kanvas-Location` (maps to API's `X-Kanvas-Branch`)
- **Per-request overrides**: any service call can override auth/location via `RequestContextOverride`
- **Filtering**: standard `where: Array<{ column, operator, value }>` across list operations
- **Pagination**: consistent `first`/`page` parameters on all list queries
- **Paginator fields in GraphQL**: Relations that return paginators (`tags`, `custom_fields`, `files`, `children`) **must** use `{ data { ... } }` wrapper — e.g. `tags { data { id name } }`, NOT `tags { id name }`. Querying scalar fields directly on a `*Paginator` type causes `Cannot query field "X" on type "XPaginator"` errors.
- **`Mixed` type for filter values**: When using `hasChannel`, `hasType`, or similar filter arguments, the `value` field expects GraphQL `Mixed` type, NOT `String`. Declare variables as `$var: Mixed!`.
- **`Message` type has no `updated_at` field** — only `created_at` is available on the dev API.

## Configuration

Plugin config via OpenClaw config system (`plugins.entries.kanvas`):

| Field | Required | Description |
|-------|----------|-------------|
| `xKanvasApp` | Yes | App/tenant identifier |
| `email` | Yes | Kanvas user email for agent login |
| `password` | Yes | Kanvas user password for agent login |
| `apiUrl` | No | GraphQL endpoint (default: `https://graphapi.kanvas.dev/graphql`) |
| `xKanvasLocation` | No | Branch/location UUID |
| `bearerToken` | No | Pre-existing bearer token (skip login) |
| `xKanvasKey` | No | App key for app-scoped auth |
| `authMode` | No | `"bearer"` (default) or `"app-key"` (auto-set with email/password) |
| `timeoutMs` | No | Request timeout (default 15000) |

All fields also fall back to `KANVAS_*` env vars.

### Authentication Flow

1. **Recommended (email/password)**: Set `email` + `password` in config. The plugin auto-authenticates via the Kanvas `login` mutation on the first tool call, caches the bearer token for the session.
2. **Direct token**: Set `bearerToken` to skip login (useful for pre-authenticated service accounts).
3. **App-key**: Set `authMode: "app-key"` + `xKanvasKey` for app-scoped access.

## Kanvas Social Domain — Messages as NoSQL Storage

The Kanvas Messages system acts as a flexible NoSQL-like document store within the relational DB:

- **`message` field**: `Mixed` GraphQL type, stored as `longText` with JSON cast. Accepts **any arbitrary JSON structure** — no schema validation at the DB level.
- **MessageType**: Identified by a unique `verb` per app (e.g. "comment", "SMS", "note", "invoice_data"). Has an optional `template` field (JSON schema). Auto-created if the verb doesn't exist yet.
- **Channels**: Bridge between messages and entities. Each entity (Lead, Order, Product, etc.) gets channels via `entity_id` + `entity_namespace` (polymorphic). Messages are attached to channels via a pivot table.
- **AppModuleMessage**: Direct entity linking — `system_modules` (entity FQCN) + `entity_id` for querying "all messages for this lead".
- **Threading**: `parent_id` field for nested conversations.
- **Custom fields**: Unlimited flexible key-value attributes stored separately (Redis-cached).
- **Distribution**: Messages can be distributed to channels, followers, or both (async via queue).
- **Files**: Attached to messages via `HasFilesystemTrait`.
- **Workflows**: Messages fire workflow events on create/update.

### Key GraphQL Operations for Messages

```graphql
# Create — message_verb auto-creates MessageType if needed
createMessage(input: MessageInput!): Message

# MessageInput fields:
#   message_verb: ID!        — type verb (required)
#   message: Mixed!          — JSON payload (required)
#   parent_id: ID            — threading
#   entity_id: Mixed         — link to entity
#   channel_slug: String     — target channel
#   is_public: Int           — 1=public, 0=internal
#   distribution: DistributionInput
#   tags: [TagInput!]
#   files: [Upload!]
#   custom_fields: [CustomFieldEntityInput!]

# Query by channel
channelMessages(channel_uuid: String, channel_slug: String): [Message!]!

# Query with filters
messages(where, hasChannel, hasType, hasAppModuleMessage, search): [Message!]!

# Message types
createMessageType(input: CreateMessageTypeInput!): MessageType  # admin only
```

## Current Status

- CRM domain: feature-complete (22 tools — CRUD leads, messages, file attachments, pipelines, statuses)
- Social domain: feature-complete (9 tools — create/get/update/delete messages, list channel messages, search, message types, anonymous email)
- Inventory domain: read-only (7 tools — search, get, list variants/warehouses/channels/categories/statuses)
- Orders domain: read-only (2 tools — search, get)
- Connection test tool (1 tool)
- **Total: 41 tools**

## Testing

Integration tests run against the **dev** Kanvas API (`graphapidev.kanvas.dev`), using `vitest`.

### Setup
- Copy `.env.test.example` to `.env.test` and fill in credentials (never commit `.env.test`)
- Required env vars: `KANVAS_API_URL`, `KANVAS_X_APP`, `KANVAS_EMAIL`, `KANVAS_PASSWORD`
- Optional: `KANVAS_X_LOCATION`, `KANVAS_X_KEY`
- vitest config auto-loads `.env.test` via `dotenv`

### Test structure
```
tests/
  setup.ts              # Shared auth helper — logs in once, reuses token
  connection.test.ts    # API connectivity and auth verification
  crm.test.ts           # Leads CRUD, messages, pipelines CRUD, lookups
  social.test.ts        # Messages CRUD, search, message types
  inventory.test.ts     # Products, variants, warehouses, channels, categories
  orders.test.ts        # Search, get
```

### Key rules for writing tests
- Tests hit a real API — they create and clean up their own data (create → test → delete)
- The `getAuthenticatedClient()` helper in `setup.ts` authenticates once and caches the client
- Some endpoints may return "unauthorized" depending on user permissions — handle gracefully
- Test timeouts are set to 30s (API can be slow)

### Common GraphQL gotchas caught by tests
- Paginator fields (`tags`, `custom_fields`, `files`) require `{ data { ... } }` wrapper
- Filter `value` fields use `Mixed` type, not `String`
- `PipelineInput` requires `is_default: Boolean!`
- `PipelineStageInput` uses `pipeline_id` (not `pipelines_id`), and `updatePipelineStage` requires `pipeline_id` in input

## TODO — Next Features to Build

### Priority 1: Orders Write Operations
- [ ] `kanvas_create_draft_order` — create draft with customer, items, region, channel
- [ ] `kanvas_update_order` — update items, fulfillment, metadata
- [ ] `kanvas_transition_order_status` — move order through status pipeline
- [ ] `kanvas_delete_order`
- [ ] `kanvas_order_change_customer`

### Priority 2: Inventory Write Operations
- [ ] Product CRUD (create, update, delete, duplicate, publish)
- [ ] Variant CRUD (create, update with channel pricing and warehouse stock)
- [ ] Category/Warehouse/Channel/Status CRUD

### Priority 3: Cross-Domain
- [ ] File upload tools (standalone upload, attach to entity)
- [ ] Tags management
- [ ] Custom fields management
- [ ] People/contacts CRUD (standalone)
