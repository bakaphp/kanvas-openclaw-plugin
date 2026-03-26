/**
 * Smoke test — verifies login, connection, and basic tool operations
 * against the real Kanvas API.
 *
 * Usage:
 *   KANVAS_X_APP=your-app-id KANVAS_EMAIL=you@example.com KANVAS_PASSWORD=secret \
 *     npx ts-node --esm scripts/smoke-test.ts
 */

import { KanvasClient } from "../src/client/kanvas-client.js";
import { CrmService } from "../src/domains/crm/index.js";
import { InventoryService } from "../src/domains/inventory/index.js";
import { OrdersService } from "../src/domains/orders/index.js";
import { SocialService } from "../src/domains/social/index.js";

const API_URL = process.env.KANVAS_API_URL || "https://graphapi.kanvas.dev/graphql";
const APP_ID = process.env.KANVAS_X_APP;
const EMAIL = process.env.KANVAS_EMAIL;
const PASSWORD = process.env.KANVAS_PASSWORD;

if (!APP_ID || !EMAIL || !PASSWORD) {
  console.error("Missing required env vars: KANVAS_X_APP, KANVAS_EMAIL, KANVAS_PASSWORD");
  process.exit(1);
}

const client = new KanvasClient({
  apiUrl: API_URL,
  xKanvasApp: APP_ID,
  authMode: "bearer",
});

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err instanceof Error ? err.message : err}`);
  }
}

async function run() {
  console.log(`\nKanvas Plugin Smoke Test`);
  console.log(`API: ${API_URL}`);
  console.log(`App: ${APP_ID}`);
  console.log(`User: ${EMAIL}\n`);

  // --- Auth ---
  console.log("Auth");
  let session: Awaited<ReturnType<typeof client.login>> | null = null;
  await test("login with email/password", async () => {
    session = await client.login(EMAIL!, PASSWORD!);
    if (!session.token) throw new Error("no token");
    console.log(`    session: ${session.uuid} (expires ${session.token_expires})`);
  });

  if (!session) {
    console.error("\nLogin failed — cannot continue.\n");
    process.exit(1);
  }

  // --- Connection ---
  console.log("\nConnection");
  await test("test connection", async () => {
    const result = await client.testConnection();
    if (!result.ok) throw new Error(result.errors.join(", "));
  });

  // --- CRM ---
  const crm = new CrmService(client);
  console.log("\nCRM");

  await test("list pipelines", async () => {
    const res = await crm.listPipelines(5);
    const count = (res as any).data?.pipelines?.data?.length ?? 0;
    console.log(`    found ${count} pipelines`);
  });

  await test("list lead statuses", async () => {
    const res = await crm.listLeadStatuses(5);
    const count = (res as any).data?.leadStatuses?.data?.length ?? 0;
    console.log(`    found ${count} statuses`);
  });

  await test("list lead sources", async () => {
    const res = await crm.listLeadSources(5);
    const count = (res as any).data?.leadSources?.data?.length ?? 0;
    console.log(`    found ${count} sources`);
  });

  await test("list lead types", async () => {
    const res = await crm.listLeadTypes(5);
    const count = (res as any).data?.leadTypes?.data?.length ?? 0;
    console.log(`    found ${count} types`);
  });

  await test("search leads", async () => {
    const res = await crm.searchLeads("test", 3);
    const count = (res as any).data?.leads?.data?.length ?? 0;
    console.log(`    found ${count} leads`);
  });

  // --- Inventory ---
  const inventory = new InventoryService(client);
  console.log("\nInventory");

  await test("search products", async () => {
    const res = await inventory.searchProducts("", 3);
    const count = (res as any).data?.products?.data?.length ?? 0;
    console.log(`    found ${count} products`);
  });

  await test("list warehouses", async () => {
    const res = await inventory.listWarehouses(3);
    const count = (res as any).data?.warehouses?.data?.length ?? 0;
    console.log(`    found ${count} warehouses`);
  });

  await test("list categories", async () => {
    const res = await inventory.listCategories(3);
    const count = (res as any).data?.categories?.data?.length ?? 0;
    console.log(`    found ${count} categories`);
  });

  // --- Orders ---
  const orders = new OrdersService(client);
  console.log("\nOrders");

  await test("search orders", async () => {
    const res = await orders.searchOrders("", 3);
    const count = (res as any).data?.orders?.data?.length ?? 0;
    console.log(`    found ${count} orders`);
  });

  // --- Social ---
  const social = new SocialService(client);
  console.log("\nSocial");

  await test("list message types", async () => {
    const res = await social.listMessageTypes(5);
    const count = (res as any).data?.messageTypes?.data?.length ?? 0;
    console.log(`    found ${count} message types`);
  });

  await test("search messages", async () => {
    const res = await social.searchMessages(undefined, 3);
    const count = (res as any).data?.messages?.data?.length ?? 0;
    console.log(`    found ${count} messages`);
  });

  // --- Summary ---
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
