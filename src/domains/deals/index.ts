import { KanvasClient } from "../../client/kanvas-client.js";
import type { CreateDealInput, UpdateDealInput } from "./types.js";

export class DealsService {
  constructor(private readonly client: KanvasClient) {}

  async listDeals(first = 25, search?: string, where?: Record<string, unknown>) {
    const query = `
      query ListDeals($first: Int, $search: String, $where: QueryDealsWhereWhereConditions) {
        deals(first: $first, search: $search, where: $where) {
          data {
            id
            uuid
            title
            description
            created_at
            updated_at
            owner { id uuid displayname }
            lead { id uuid }
            people { id uuid firstname lastname }
            organization { id name }
            pipeline { id name }
            stage { id name }
            status { id name }
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

  async getDeal(id: string) {
    const query = `
      query GetDeal($id: ID!) {
        deal(id: $id) {
          id
          uuid
          title
          description
          created_at
          updated_at
          owner { id uuid displayname }
          lead { id uuid }
          people { id uuid firstname lastname }
          organization { id name }
          pipeline { id name }
          stage { id name }
          status { id name }
          tags { id name }
          custom_fields { name value }
        }
      }
    `;

    return this.client.query(query, { id });
  }

  async createDeal(input: CreateDealInput) {
    const mutation = `
      mutation CreateDeal($input: DealInput!) {
        createDeal(input: $input) {
          id
          uuid
          title
          description
          created_at
          owner { id uuid displayname }
          pipeline { id name }
          stage { id name }
          status { id name }
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  async updateDeal(id: string, input: UpdateDealInput) {
    const mutation = `
      mutation UpdateDeal($id: ID!, $input: UpdateDealInput!) {
        updateDeal(id: $id, input: $input) {
          id
          uuid
          title
          description
          updated_at
          owner { id uuid displayname }
          pipeline { id name }
          stage { id name }
          status { id name }
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async deleteDeal(id: string) {
    const mutation = `
      mutation DeleteDeal($id: ID!) {
        deleteDeal(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }
}
