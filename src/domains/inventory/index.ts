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
            categories { id name }
            warehouses { id name }
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
      where: { column: "ID", operator: "EQ", value: id },
    });
  }

  async listVariants(first = 25, where?: Array<Record<string, unknown>>) {
    const query = `
      query Variants($first: Int, $where: QueryVariantsWhereWhereConditions) {
        variants(first: $first, where: $where) {
          data {
            id
            uuid
            name
            sku
            ean
            barcode
            is_published
            status { id name }
            product {
              id
              uuid
              name
            }
            channels {
              name
              warehouses_id
              discounted_price
              price
              channels_id
              is_published
            }
            warehouses {
              quantity
              price
              cost
              warehouseinfo {
                id
                name
                location
                total_products
              }
            }
            attributes {
              id
              name
              value
            }
          }
        }
      }
    `;

    return this.client.query(query, { first, where });
  }

  async listWarehouses(first = 50, where?: Array<Record<string, unknown>>) {
    const query = `
      query Warehouses($first: Int, $where: QueryWarehousesWhereWhereConditions) {
        warehouses(first: $first, where: $where) {
          data {
            id
            uuid
            name
            is_default
            is_published
            location
            total_products
            regions {
              name
              currencies {
                id
                code
                currency
              }
            }
            company {
              id
              name
            }
          }
        }
      }
    `;

    return this.client.query(query, { first, where });
  }

  async listChannels(first = 50, where?: Array<Record<string, unknown>>) {
    const query = `
      query Channels($first: Int, $where: QueryChannelsWhereWhereConditions) {
        channels(first: $first, where: $where) {
          data {
            id
            uuid
            name
            slug
            is_default
            is_published
            companies {
              id
              name
            }
            regions {
              id
              name
            }
          }
        }
      }
    `;

    return this.client.query(query, { first, where });
  }

  async listCategories(first = 50, where?: Array<Record<string, unknown>>) {
    const query = `
      query Categories($first: Int, $where: QueryCategoriesWhereWhereConditions) {
        categories(first: $first, where: $where) {
          data {
            id
            uuid
            name
            slug
            code
            total_products
            is_published
            companies {
              id
              name
            }
          }
        }
      }
    `;

    return this.client.query(query, { first, where });
  }

  async listStatuses(first = 50, where?: Array<Record<string, unknown>>) {
    const query = `
      query Statuses($first: Int, $where: QueryStatusWhereWhereConditions) {
        status(first: $first, where: $where) {
          data {
            id
            name
            slug
            is_default
            is_published
            company {
              id
              name
            }
          }
        }
      }
    `;

    return this.client.query(query, { first, where });
  }
}
