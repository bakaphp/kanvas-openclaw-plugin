# Kanvas OpenClaw Plugin Plan

## Workspace

- `code/kanvas-openclaw-plugin` → plugin repo
- `code/kanvas-core-admin-v2` → admin reference app
- `code/kanvas-ecosystem-api` → backend + GraphQL schema source

## Goal

Build an OpenClaw plugin for Kanvas that gives agent access to:
- CRM
- Inventory
- Orders

using Kanvas GraphQL in a way that respects:
- app context
- location/branch context
- multi-tenant auth
- safe write boundaries

## What I verified

### Admin app surface
The admin app is a Next.js frontend using Apollo GraphQL against Kanvas.
Relevant areas exist for:
- CRM: `src/graphql/queries/crm/*`, `src/graphql/mutations/crm/*`
- Inventory: `src/graphql/queries/inventory/*`, `src/graphql/mutations/inventory/*`
- Commerce / Orders: `src/graphql/queries/commerce/*`, `src/graphql/mutations/commerce/*`

### Backend/API surface
The ecosystem API is Laravel + Lighthouse GraphQL with domain schemas for:
- CRM / Guild: `graphql/schemas/Guild/*.graphql`
- Inventory: `graphql/schemas/Inventory/*.graphql`
- Commerce / Orders: `graphql/schemas/Souk/order.graphql`

### Multi-tenant / auth model confirmed
Kanvas requests can be shaped by these headers:
- `X-Kanvas-App` → selects the app/tenant context
- `X-Kanvas-Location` → selects the company branch/location context
- `X-Kanvas-Key` → app credential for app-key-protected operations
- `Authorization: Bearer <token>` → user-scoped auth

So the plugin needs to support two auth modes:

#### Mode A — user-scoped
- `X-Kanvas-App`
- `Authorization: Bearer ...`
- optional `X-Kanvas-Location`

#### Mode B — app-scoped
- `X-Kanvas-App`
- `X-Kanvas-Key`
- optional `X-Kanvas-Location`

## Key operations confirmed from admin + schema

### CRM
- Query leads
- Query pipelines
- Query lead sources / types / statuses
- Update lead
- Manage participants / rotations / receivers
- Need to confirm exact `createLead` mutation input before implementation, but **create lead is required in v1 scope**

### Inventory
- Query products
- Query variants
- Query categories / channels / warehouses / status / attributes
- Product detail includes SKU, variants, warehouse info, publish state

### Orders / Commerce
- Query orders
- Query order detail
- Query order statuses and types
- Create draft order
- Update order
- Transition order status
- Change customer on order
- Fetch order pipeline/messages

## Recommended plugin shape

The plugin should not try to mirror the whole admin UI.
It should expose a small set of high-value agent actions on top of Kanvas GraphQL.

## Plugin v1 goals

### 1) CRM actions
- create lead
- search leads
- get lead details
- update lead
- update lead status/stage
- update lead owner/receiver if safe
- add participants if needed
- list pipelines, stages, sources, types, statuses

### 2) Inventory actions
- search products by name / sku / uuid
- get product detail
- list variants for a product
- inspect channels / warehouses / status
- basic stock visibility where exposed through variants/warehouses

### 3) Orders actions
- search orders by number / customer / status
- get order detail
- create draft order
- update order metadata/basic fields
- transition order status
- change order customer when required
- list order statuses and types

## Proposed tool/API contract for OpenClaw

### Authentication / config
- `kanvas_configure`
  - `apiUrl`
  - `xKanvasApp`
  - optional `xKanvasLocation`
  - auth mode (`bearer` or `app-key`)
  - `bearerToken` or `xKanvasKey`
- `kanvas_test_connection`

### CRM tools
- `kanvas_create_lead`
- `kanvas_search_leads`
- `kanvas_get_lead`
- `kanvas_update_lead`
- `kanvas_list_pipelines`
- `kanvas_list_lead_statuses`
- `kanvas_list_lead_sources`
- `kanvas_list_lead_types`

### Inventory tools
- `kanvas_search_products`
- `kanvas_get_product`
- `kanvas_list_variants`
- `kanvas_list_warehouses`
- `kanvas_list_channels`
- `kanvas_list_categories`

### Orders tools
- `kanvas_search_orders`
- `kanvas_get_order`
- `kanvas_create_draft_order`
- `kanvas_update_order`
- `kanvas_transition_order_status`
- `kanvas_change_order_customer`
- `kanvas_list_order_statuses`
- `kanvas_list_order_types`

## Suggested implementation phases

### Phase 0 — bootstrap plugin repo
- initialize repo structure
- choose runtime/language for OpenClaw plugin
- add config loading + env handling
- add auth/header builder for `X-Kanvas-App`, `X-Kanvas-Location`, `X-Kanvas-Key`, bearer token
- add GraphQL client wrapper
- add error normalization
- add logging
- add README with setup

### Phase 1 — read foundation
Start with read paths first to de-risk auth and schema assumptions.

Deliver:
- auth/config
- connection test
- search/get leads
- search/get products
- search/get orders
- list statuses/types/pipelines/warehouses/channels

Outcome:
- immediate operator value
- validates auth, tenancy, pagination, filters, and GraphQL conventions

### Phase 2 — essential writes
Deliver:
- create lead
- update lead
- create draft order
- update order
- transition order status
- change order customer

Guardrails:
- explicit validation
- scoped writes only
- preserve ids/uuids in outputs
- idempotency where possible
- dry-run/log mode if useful

### Phase 3 — advanced ops
Potential follow-ups:
- richer inventory adjustments if schema supports safe mutation paths
- comments/notes/messages helpers
- batch queries
- workflow/webhook hooks
- cross-domain action chains like lead → customer → draft order

## Architecture recommendation

### Internal layers
1. `config/`
   - env + auth configuration
2. `client/`
   - Kanvas GraphQL transport
   - header builder
   - request executor
3. `domains/crm/`
4. `domains/inventory/`
5. `domains/orders/`
6. `tools/`
   - OpenClaw-exposed tool handlers
7. `tests/`

## Important design choices
- keep GraphQL documents close to domain modules
- map Kanvas schema responses into smaller plugin-facing DTOs
- avoid exposing raw schema complexity to the LLM when unnecessary
- preserve IDs + UUIDs in responses for follow-up actions
- support pagination consistently
- allow per-request location override when needed

## Key risks / things to verify early

### 1) Exact create-lead mutation contract
Need to confirm:
- exact mutation name
- required fields
- optional fields: pipeline, stage, source, type, owner, participants, custom fields, branch binding

### 2) Auth model
Need to confirm the preferred plugin auth path for production use:
- bearer token only?
- app key only?
- or dual mode depending on operation?

### 3) Tenancy context
Kanvas is multi-tenant. We need to know which of these are required per request:
- app
- branch/location
- user context
- any company-level scoping not already implied by app/location

### 4) Safe write boundaries
Inventory writes may be riskier than CRM/order updates. Recommendation:
- read-only inventory first
- no stock mutation until exact business semantics are confirmed

### 5) Notes/comments model
Need to determine whether notes should map to:
- messages
- activities
- custom fields
- event/comments
- social channel entities

## What I would build first

### First milestone
- plugin skeleton
- Kanvas client
- health/test tool
- `kanvas_search_leads`
- `kanvas_get_lead`
- `kanvas_search_products`
- `kanvas_get_product`
- `kanvas_search_orders`
- `kanvas_get_order`

This gives us real utility on day one and proves the integration path.

### Second milestone
- `kanvas_create_lead`
- `kanvas_update_lead`
- `kanvas_create_draft_order`
- `kanvas_update_order`
- `kanvas_transition_order_status`

This gives us the first meaningful operational write flows.

## Immediate next steps

1. confirm plugin runtime (likely Node/TypeScript unless OpenClaw plugin constraints suggest otherwise)
2. extract exact GraphQL operations for milestone one
3. confirm exact create-lead mutation/input from schema/code
4. scaffold the plugin repo
5. implement read foundation first
6. implement lead creation immediately after read path validation
7. test against the available Kanvas environment

## Final recommendation

Start with:
- CRM read + create/update lead
- Inventory read
- Orders read + create/update/transition

Hold off briefly on:
- inventory mutation flows

That gives us the best mix of:
- immediate business value
- safe rollout
- correct multi-tenant handling
- clean path for expansion
