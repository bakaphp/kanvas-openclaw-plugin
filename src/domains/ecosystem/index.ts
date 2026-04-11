import { KanvasClient } from "../../client/kanvas-client.js";

export class EcosystemService {
  constructor(private readonly client: KanvasClient) {}

  // ── Companies ──────────────────────────────────────────────

  async listCompanies(first = 25, search?: string, where?: Record<string, unknown>) {
    const query = `
      query ListCompanies($first: Int, $search: String, $where: QueryCompaniesWhereWhereConditions) {
        companies(first: $first, search: $search, where: $where) {
          data {
            id
            uuid
            name
            website
            email
            phone
            address
            city
            state
            country
            zip
            is_active
            total_users
            total_branches
            created_at
          }
          paginatorInfo {
            currentPage
            lastPage
            total
          }
        }
      }
    `;

    return this.client.query(query, { first, search, where });
  }

  // ── Branches ───────────────────────────────────────────────

  async listBranches(first = 25, search?: string, where?: Record<string, unknown>) {
    const query = `
      query ListBranches($first: Int, $search: String, $where: QueryBranchesWhereWhereConditions) {
        branches(first: $first, search: $search, where: $where) {
          data {
            id
            uuid
            name
            companies_id
            email
            phone
            address
            city
            state
            country
            zip
            is_default
            is_active
            total_users
            created_at
          }
          paginatorInfo {
            currentPage
            lastPage
            total
          }
        }
      }
    `;

    return this.client.query(query, { first, search, where });
  }

  // ── Roles ──────────────────────────────────────────────────

  async listRoles(first = 50, search?: string) {
    const query = `
      query ListRoles($first: Int, $search: String) {
        roles(first: $first, search: $search) {
          data {
            id
            name
            title
            scope
            userCount
            systemRole
          }
        }
      }
    `;

    return this.client.query(query, { first, search });
  }

  // ── Company Users ──────────────────────────────────────────

  async listCompanyUsers(first = 25, search?: string, where?: Record<string, unknown>) {
    const query = `
      query ListCompanyUsers($first: Int, $search: String, $where: QueryCompanyUsersWhereWhereConditions) {
        companyUsers(first: $first, search: $search, where: $where) {
          data {
            id
            uuid
            firstname
            lastname
            email
            displayname
            roles
          }
          paginatorInfo {
            currentPage
            lastPage
            total
          }
        }
      }
    `;

    return this.client.query(query, { first, search, where });
  }

  // ── User-Company Management ────────────────────────────────

  async addUserToCompany(companyId: string, userId: string, roleId?: string) {
    const mutation = `
      mutation AddUserToCompany($id: ID!, $user_id: ID!, $rol_id: ID) {
        addUserToCompany(id: $id, user_id: $user_id, rol_id: $rol_id)
      }
    `;

    return this.client.query(mutation, {
      id: companyId,
      user_id: userId,
      rol_id: roleId,
    });
  }

  async removeUserFromCompany(companyId: string, userId: string) {
    const mutation = `
      mutation RemoveUserFromCompany($id: ID!, $user_id: ID!) {
        removeUserFromCompany(id: $id, user_id: $user_id)
      }
    `;

    return this.client.query(mutation, { id: companyId, user_id: userId });
  }

  // ── User-Branch Management ─────────────────────────────────

  async addUserToBranch(branchId: string, userId: string) {
    const mutation = `
      mutation AddUserToBranch($id: ID!, $user_id: ID!) {
        addUserToBranch(id: $id, user_id: $user_id)
      }
    `;

    return this.client.query(mutation, { id: branchId, user_id: userId });
  }

  async removeUserFromBranch(branchId: string, userId: string) {
    const mutation = `
      mutation RemoveUserFromBranch($id: ID!, $user_id: ID!) {
        removeUserFromBranch(id: $id, user_id: $user_id)
      }
    `;

    return this.client.query(mutation, { id: branchId, user_id: userId });
  }

  // ── Role Assignment ────────────────────────────────────────

  async assignRoleToUser(userId: string, roleIds: string[]) {
    const mutation = `
      mutation AssignRoleToUser($userId: ID!, $roleIds: [ID!]!) {
        assignRoleToUser(userId: $userId, roleIds: $roleIds)
      }
    `;

    return this.client.query(mutation, { userId, roleIds });
  }

  async removeRoleFromUser(userId: string, role: string) {
    const mutation = `
      mutation RemoveRole($userId: ID!, $role: Mixed!) {
        removeRole(userId: $userId, role: $role)
      }
    `;

    return this.client.query(mutation, { userId, role });
  }
}
