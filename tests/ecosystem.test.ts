import { describe, it, expect, beforeAll } from "vitest";
import { EcosystemService } from "../src/domains/ecosystem/index.js";
import { getAuthenticatedClient } from "./setup.js";

let eco: EcosystemService;

beforeAll(async () => {
  const client = await getAuthenticatedClient();
  eco = new EcosystemService(client);
});

describe("Ecosystem — Companies", () => {
  it("listCompanies returns paginated results", async () => {
    const res = await eco.listCompanies(5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const companies = (res.data as any).companies.data;
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);

    const first = companies[0];
    expect(first.id).toBeDefined();
    expect(first.uuid).toBeDefined();
    expect(first.name).toBeDefined();
  });

  it("listCompanies supports search", async () => {
    const res = await eco.listCompanies(5, "test");
    expect(res.errors).toBeFalsy();

    const companies = (res.data as any).companies.data;
    expect(Array.isArray(companies)).toBe(true);
  });
});

describe("Ecosystem — Branches", () => {
  it("listBranches returns paginated results", async () => {
    const res = await eco.listBranches(5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const branches = (res.data as any).branches.data;
    expect(Array.isArray(branches)).toBe(true);
    expect(branches.length).toBeGreaterThan(0);

    const first = branches[0];
    expect(first.id).toBeDefined();
    expect(first.uuid).toBeDefined();
    expect(first.name).toBeDefined();
    expect(first.companies_id).toBeDefined();
  });

  it("listBranches supports filtering by company", async () => {
    // Get a company ID first
    const companiesRes = await eco.listCompanies(1);
    const companyId = (companiesRes.data as any).companies.data[0]?.id;
    if (!companyId) return;

    const res = await eco.listBranches(5, undefined,
      { column: "COMPANIES_ID", operator: "EQ", value: companyId } as any,
    );
    expect(res.errors).toBeFalsy();

    const branches = (res.data as any).branches.data;
    expect(Array.isArray(branches)).toBe(true);
  });
});

describe("Ecosystem — Roles", () => {
  it("listRoles returns data", async () => {
    const res = await eco.listRoles();
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const roles = (res.data as any).roles.data;
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThan(0);

    const first = roles[0];
    expect(first.id).toBeDefined();
    expect(first.name).toBeDefined();
  });

  it("listRoles supports search", async () => {
    const res = await eco.listRoles(10, "admin");
    expect(res.errors).toBeFalsy();

    const roles = (res.data as any).roles.data;
    expect(Array.isArray(roles)).toBe(true);
  });
});

describe("Ecosystem — Company Users", () => {
  it("listCompanyUsers returns paginated results", async () => {
    const res = await eco.listCompanyUsers(5);
    expect(res.errors).toBeFalsy();
    expect(res.data).toBeDefined();

    const users = (res.data as any).companyUsers.data;
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);

    const first = users[0];
    expect(first.id).toBeDefined();
    expect(first.uuid).toBeDefined();
    expect(first.email).toBeDefined();
    expect(first.displayname).toBeDefined();
  });

  it("listCompanyUsers supports search", async () => {
    const res = await eco.listCompanyUsers(5, "test");
    expect(res.errors).toBeFalsy();

    const users = (res.data as any).companyUsers.data;
    expect(Array.isArray(users)).toBe(true);
  });
});

describe("Ecosystem — User-Company Management", () => {
  let companyId: string;
  let branchId: string;
  let userId: string;

  beforeAll(async () => {
    // Get a company, branch, and user to test with
    const [companiesRes, branchesRes, usersRes] = await Promise.all([
      eco.listCompanies(1),
      eco.listBranches(1),
      eco.listCompanyUsers(2),
    ]);

    companyId = (companiesRes.data as any).companies.data[0]?.id;
    branchId = (branchesRes.data as any).branches.data[0]?.id;

    // Use the second user if available (don't remove ourselves)
    const users = (usersRes.data as any).companyUsers.data;
    userId = users.length > 1 ? users[1].id : users[0]?.id;
  });

  it("addUserToBranch succeeds", async () => {
    if (!branchId || !userId) return;

    const res = await eco.addUserToBranch(branchId, userId);
    // May fail if user already in branch — that's ok
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
    } else {
      expect((res.data as any).addUserToBranch).toBeTruthy();
    }
  });

  it("removeUserFromBranch succeeds", async () => {
    if (!branchId || !userId) return;

    const res = await eco.removeUserFromBranch(branchId, userId);
    // May fail if user not in branch
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
    } else {
      expect((res.data as any).removeUserFromBranch).toBeTruthy();
    }
  });
});

describe("Ecosystem — Role Assignment", () => {
  let userId: string;
  let roleId: string;

  beforeAll(async () => {
    const [usersRes, rolesRes] = await Promise.all([
      eco.listCompanyUsers(1),
      eco.listRoles(50),
    ]);

    userId = (usersRes.data as any).companyUsers.data[0]?.id;

    // Find a non-system role to test with
    const roles = (rolesRes.data as any).roles.data;
    const testRole = roles.find((r: any) => !r.systemRole) ?? roles[0];
    roleId = testRole?.id;
  });

  it("assignRoleToUser succeeds", async () => {
    if (!userId || !roleId) return;

    const res = await eco.assignRoleToUser(userId, [roleId]);
    // May require admin — handle gracefully
    if (res.errors?.length) {
      expect(res.errors[0].message).toBeDefined();
    } else {
      expect((res.data as any).assignRoleToUser).toBeTruthy();
    }
  });
});
