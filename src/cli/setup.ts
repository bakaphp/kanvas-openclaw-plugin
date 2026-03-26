import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { KanvasClient } from "../client/kanvas-client.js";

const DEFAULT_API_URL = "https://graphapi.kanvas.dev/graphql";

interface SetupResult {
  apiUrl: string;
  xKanvasApp: string;
  email: string;
  password: string;
  xKanvasLocation?: string;
  xKanvasKey?: string;
}

async function prompt(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  const suffix = defaultValue ? ` (${defaultValue})` : "";
  const answer = await rl.question(`  ${question}${suffix}: `);
  return answer.trim() || defaultValue || "";
}

export async function runSetup(): Promise<SetupResult> {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    console.log("\n  Kanvas Plugin Setup\n  ───────────────────\n");

    const apiUrl = await prompt(rl, "API URL", DEFAULT_API_URL);
    const xKanvasApp = await prompt(rl, "App ID (X-Kanvas-App)");
    if (!xKanvasApp) {
      throw new Error("App ID is required");
    }

    const email = await prompt(rl, "Agent email");
    if (!email) {
      throw new Error("Email is required");
    }

    const password = await prompt(rl, "Agent password");
    if (!password) {
      throw new Error("Password is required");
    }

    const xKanvasLocation = await prompt(rl, "Branch/Location UUID (optional)");
    const xKanvasKey = await prompt(rl, "App Key (optional, for anonymous email)");

    // Test the credentials
    console.log("\n  Testing connection...");
    const client = new KanvasClient({
      apiUrl,
      xKanvasApp,
      authMode: "bearer",
    });

    const session = await client.login(email, password);
    console.log(`  Authenticated as ${session.uuid}`);

    const conn = await client.testConnection();
    if (!conn.ok) {
      console.error(`  Connection test failed: ${conn.errors.join(", ")}`);
    } else {
      console.log("  Connection OK\n");
    }

    const result: SetupResult = { apiUrl, xKanvasApp, email, password };
    if (xKanvasLocation) result.xKanvasLocation = xKanvasLocation;
    if (xKanvasKey) result.xKanvasKey = xKanvasKey;

    // Print the config for the user to copy
    console.log("  Add this to your OpenClaw config:\n");
    console.log("  plugins:");
    console.log("    entries:");
    console.log("      kanvas:");
    console.log("        enabled: true");
    console.log("        config:");
    if (apiUrl !== DEFAULT_API_URL) {
      console.log(`          apiUrl: "${apiUrl}"`);
    }
    console.log(`          xKanvasApp: "${xKanvasApp}"`);
    console.log(`          email: "${email}"`);
    console.log(`          password: "${password}"`);
    if (xKanvasLocation) {
      console.log(`          xKanvasLocation: "${xKanvasLocation}"`);
    }
    if (xKanvasKey) {
      console.log(`          xKanvasKey: "${xKanvasKey}"`);
    }
    console.log("");

    return result;
  } finally {
    rl.close();
  }
}
