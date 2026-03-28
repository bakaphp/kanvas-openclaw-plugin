import { KanvasClient } from "../../client/kanvas-client.js";

export class OrdersService {
  constructor(private readonly client: KanvasClient) {}

  async searchOrders(search: string, first = 10) {
    const query = `
      query SearchOrders($first: Int!, $search: String) {
        orders(first: $first, search: $search) {
          data {
            id
            uuid
            order_number
            status
            created_at
            fulfillment_status
            total_net_amount
            total_gross_amount
            order_status { id name slug }
          }
        }
      }
    `;

    return this.client.query(query, { first, search });
  }

  async getOrder(id: string) {
    const query = `
      query GetOrder($first: Int!, $where: QueryOrdersWhereWhereConditions) {
        orders(first: $first, where: $where) {
          data {
            id
            uuid
            order_number
            status
            currency
            created_at
            fulfillment_status
            payment_status
            order_status { id name slug }
            people { id uuid name }
            items(includeAllItems: true) {
              id
              uuid
              product_name
              product_sku
              quantity
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
}
