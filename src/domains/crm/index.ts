import { KanvasClient } from "../../client/kanvas-client.js";
import { CreateLeadInput, UpdateLeadInput } from "./types.js";

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
            branch { id }
            people { id uuid firstname lastname }
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

  async createLead(input: CreateLeadInput) {
    const mutation = `
      mutation CreateLead($input: LeadInput!) {
        createLead(input: $input) {
          id
          uuid
          title
          firstname
          lastname
          email
          phone
          description
          branch { id }
          status { id name }
          type { id name }
          source { id name }
          pipeline { id name }
          stage { id name }
          people { id uuid firstname lastname }
          organization { name }
          created_at
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  async updateLead(id: string, input: UpdateLeadInput) {
    const mutation = `
      mutation UpdateLead($id: ID!, $input: LeadUpdateInput!) {
        updateLead(id: $id, input: $input) {
          id
          uuid
          title
          description
          status { id name }
          stage { id name }
          pipeline { id name }
          owner { id uuid displayname }
          updated_at
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async listLeadStatuses(first = 50) {
    const query = `
      query LeadStatuses($first: Int) {
        leadStatuses(first: $first) {
          data {
            id
            name
            is_default
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listLeadSources(first = 50) {
    const query = `
      query LeadSources($first: Int) {
        leadSources(first: $first) {
          data {
            id
            name
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listLeadTypes(first = 50) {
    const query = `
      query LeadTypes($first: Int) {
        leadTypes(first: $first) {
          data {
            id
            name
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listPipelines(first = 50) {
    const query = `
      query Pipelines($first: Int) {
        pipelines(first: $first) {
          data {
            id
            name
            stages {
              id
              name
            }
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }
}
