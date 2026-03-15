import { KanvasClient } from "../../client/kanvas-client.js";

export class CrmService {
  constructor(private readonly client: KanvasClient) {}

  async searchLeads(search: string, first = 10) {
    const query = `
      query SearchLeads($first: Int, $search: String) {
        leads(first: $first, search: $search) {
          data {
            id
            uuid
            firstname
            lastname
            email
            phone
            created_at
            status { id name }
            type { id name }
            source { id name }
          }
        }
      }
    `;

    return this.client.query(query, { first, search });
  }

  async getLead(id: string) {
    const query = `
      query GetLead($first: Int!, $where: QueryLeadsWhereWhereConditions) {
        leads(first: $first, where: $where) {
          data {
            id
            uuid
            firstname
            lastname
            email
            phone
            description
            status { id name }
            stage { id name }
            pipeline { id name }
            owner { id uuid displayname }
          }
        }
      }
    `;

    return this.client.query(query, {
      first: 1,
      where: [{ column: "ID", operator: "EQ", value: id }],
    });
  }

  async createLead(_input: Record<string, unknown>) {
    return {
      implemented: false,
      note: "Create lead will be wired after confirming the exact createLead GraphQL mutation contract.",
    };
  }
}
