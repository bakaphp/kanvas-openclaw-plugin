import { KanvasClient } from "../../client/kanvas-client.js";

export class InventoryService {
  constructor(private readonly client: KanvasClient) {}

  async searchProducts(search: string, first = 10) {
    const query = `
      query SearchProducts($first: Int, $search: String) {
        products(first: $first, search: $search) {
          data {
            id
            uuid
            name
            slug
            is_published
            created_at
            status { name }
            warehouses { id name }
          }
        }
      }
    `;

    return this.client.query(query, { first, search });
  }

  async getProduct(id: string) {
    const query = `
      query GetProduct($first: Int, $where: QueryProductsWhereWhereConditions) {
        products(first: $first, where: $where) {
          data {
            id
            uuid
            name
            slug
            description
            is_published
            status { id name }
            variants(includeUnpublished: true) {
              id
              uuid
              name
              sku
            }
          }
        }
      }
    `;

    return this.client.query(query, {
      first: 1,
      where: [{ column: "ID", operator: "EQ", value: id }],
    });
  }
}
