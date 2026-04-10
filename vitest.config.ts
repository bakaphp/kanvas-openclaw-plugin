import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.test" });

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
