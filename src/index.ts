import { loadConfigFromEnv } from "./config/env.js";
import { KanvasClient } from "./client/kanvas-client.js";
import { CrmService } from "./domains/crm/index.js";
import { InventoryService } from "./domains/inventory/index.js";
import { OrdersService } from "./domains/orders/index.js";
import { createCrmTools } from "./tools/crm.js";
import { createInventoryTools } from "./tools/inventory.js";
import { createOrdersTools } from "./tools/orders.js";

export function createPlugin() {
  const config = loadConfigFromEnv();
  const client = new KanvasClient(config);

  return {
    config,
    client,
    tools: {
      ...createCrmTools(new CrmService(client)),
      ...createInventoryTools(new InventoryService(client)),
      ...createOrdersTools(new OrdersService(client)),
      kanvas_test_connection: () => client.testConnection(),
    },
  };
}

if (process.env.NODE_ENV !== "test") {
  console.log("Kanvas OpenClaw plugin scaffold ready");
}
