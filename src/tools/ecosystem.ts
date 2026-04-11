import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { EcosystemService } from "../domains/ecosystem/index.js";
import { toolResult, type EnsureAuth } from "./helpers.js";

const WhereClause = Type.Optional(
  Type.Array(
    Type.Object({
      column: Type.String(),
      operator: Type.String({ description: 'e.g. "EQ", "LIKE"' }),
      value: Type.Unknown(),
    }),
    { description: "Filter conditions" }
  )
);

export function registerEcosystemTools(api: OpenClawPluginApi, service: EcosystemService, ensureAuth: EnsureAuth) {

  // ── Read tools ─────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_list_companies",
    label: "List Companies",
    description: "List or search companies in the Kanvas ecosystem.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      search: Type.Optional(Type.String({ description: "Search keyword" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listCompanies(params.first, params.search, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_branches",
    label: "List Branches",
    description: "List or search company branches. Filter by companies_id to get branches for a specific company.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      search: Type.Optional(Type.String({ description: "Search keyword" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listBranches(params.first, params.search, params.where as any));
    },
  });

  api.registerTool({
    name: "kanvas_list_roles",
    label: "List Roles",
    description: "List available roles. Use this to find role IDs (e.g. super admin) before assigning roles to users.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 50)" })),
      search: Type.Optional(Type.String({ description: "Search by role name" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listRoles(params.first, params.search));
    },
  });

  api.registerTool({
    name: "kanvas_list_company_users",
    label: "List Company Users",
    description: "List users in the current company. Supports search and filtering by user fields.",
    parameters: Type.Object({
      first: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
      search: Type.Optional(Type.String({ description: "Search keyword" })),
      where: WhereClause,
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.listCompanyUsers(params.first, params.search, params.where as any));
    },
  });

  // ── Write tools ────────────────────────────────────────────

  api.registerTool({
    name: "kanvas_add_user_to_company",
    label: "Add User to Company",
    description: "Add an existing user to a company, optionally with a specific role.",
    parameters: Type.Object({
      company_id: Type.String({ description: "Company ID" }),
      user_id: Type.String({ description: "User ID" }),
      role_id: Type.Optional(Type.String({ description: "Role ID (use kanvas_list_roles to find it)" })),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.addUserToCompany(params.company_id, params.user_id, params.role_id));
    },
  });

  api.registerTool({
    name: "kanvas_remove_user_from_company",
    label: "Remove User from Company",
    description: "Remove a user from a company.",
    parameters: Type.Object({
      company_id: Type.String({ description: "Company ID" }),
      user_id: Type.String({ description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.removeUserFromCompany(params.company_id, params.user_id));
    },
  });

  api.registerTool({
    name: "kanvas_add_user_to_branch",
    label: "Add User to Branch",
    description: "Add a user to a company branch/location.",
    parameters: Type.Object({
      branch_id: Type.String({ description: "Branch ID" }),
      user_id: Type.String({ description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.addUserToBranch(params.branch_id, params.user_id));
    },
  });

  api.registerTool({
    name: "kanvas_remove_user_from_branch",
    label: "Remove User from Branch",
    description: "Remove a user from a company branch/location.",
    parameters: Type.Object({
      branch_id: Type.String({ description: "Branch ID" }),
      user_id: Type.String({ description: "User ID" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.removeUserFromBranch(params.branch_id, params.user_id));
    },
  });

  api.registerTool({
    name: "kanvas_assign_role_to_user",
    label: "Assign Role to User",
    description: "Assign one or more roles to a user. Requires admin privileges. Use kanvas_list_roles to find role IDs.",
    parameters: Type.Object({
      user_id: Type.String({ description: "User ID" }),
      role_ids: Type.Array(Type.String(), { description: "Array of role IDs to assign" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.assignRoleToUser(params.user_id, params.role_ids));
    },
  });

  api.registerTool({
    name: "kanvas_remove_role_from_user",
    label: "Remove Role from User",
    description: "Remove a role from a user. The role parameter can be the role ID or name.",
    parameters: Type.Object({
      user_id: Type.String({ description: "User ID" }),
      role: Type.String({ description: "Role ID or name to remove" }),
    }),
    async execute(_id, params) {
      await ensureAuth();
      return toolResult(await service.removeRoleFromUser(params.user_id, params.role));
    },
  });
}
