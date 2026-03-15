# Kanvas OpenClaw Plugin

Initial scaffold for an OpenClaw plugin that connects Kanvas to agent workflows across CRM, inventory, and orders.

## Current status

This is the first implementation pass.
It includes:
- TypeScript project scaffold
- Kanvas config model
- header builder for multi-tenant Kanvas requests
- minimal GraphQL client
- connection test helper
- starter CRM / inventory / orders service modules
- initial tool wrappers

It does **not** yet include the final OpenClaw runtime manifest/wiring because the exact plugin packaging contract has not been confirmed inside this repo. The internal structure is ready for that integration layer.

## Multi-tenant request model

Supported request headers/auth patterns:

### User-scoped mode
- `X-Kanvas-App`
- `Authorization: Bearer <token>`
- optional `X-Kanvas-Location`

### App-scoped mode
- `X-Kanvas-App`
- `X-Kanvas-Key`
- optional `X-Kanvas-Location`

## Environment assumptions

Set environment variables before loading the plugin:

```bash
KANVAS_API_URL=https://your-kanvas-api/graphql
KANVAS_X_APP=your-app-key
KANVAS_X_LOCATION=optional-branch-uuid
KANVAS_AUTH_MODE=bearer
KANVAS_BEARER_TOKEN=your-user-token
# OR
KANVAS_AUTH_MODE=app-key
KANVAS_X_KEY=your-app-secret
```

Optional:

```bash
KANVAS_TIMEOUT_MS=15000
```

## Project structure

```text
src/
  client/       GraphQL transport + Kanvas header handling
  config/       config types + env loading
  domains/      crm / inventory / orders modules
  tools/        plugin-facing wrappers
  index.ts      plugin entry scaffold
```

## First-pass implemented pieces

### Config
- `loadConfigFromEnv()`
- `KanvasConfig` type

### Client
- `buildKanvasHeaders()`
- `KanvasClient.query()`
- `KanvasClient.testConnection()`

### CRM
- `searchLeads()`
- `getLead()`
- `createLead()`
- `updateLead()`
- `listLeadStatuses()`
- `listLeadSources()`
- `listLeadTypes()`
- `listPipelines()`

### Inventory
- `searchProducts()`
- `getProduct()`
- `listVariants()`
- `listWarehouses()`
- `listChannels()`
- `listCategories()`
- `listStatuses()`

### Orders
- `searchOrders()`
- `getOrder()`

## Next implementation steps

1. confirm exact `createLead` GraphQL mutation and input contract
2. add normalized result mappers
3. add list helpers for pipelines, statuses, sources, types, warehouses, channels
4. implement remaining write flows:
   - create draft order
   - update order
   - transition order status
   - change order customer
5. wire the final OpenClaw plugin manifest/runtime integration
6. add tests

## Notes

- Inventory write operations are intentionally deferred until business semantics are confirmed.
- IDs and UUIDs should be preserved in all tool responses for follow-up actions.
- Per-request location override is supported by the client override model.
