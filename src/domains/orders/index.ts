import { KanvasClient } from "../../client/kanvas-client.js";
import type {
  CreateDraftOrderInput,
  DraftOrderStatus,
  UpdateOrderInput,
} from "./types.js";

export class OrdersService {
  constructor(private readonly client: KanvasClient) {}

  // ── Read ───────────────────────────────────────────────────

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

  // ── Lookups ────────────────────────────────────────────────

  async listOrderStatuses(first = 50) {
    const query = `
      query ListOrderStatuses($first: Int) {
        orderStatuses(first: $first) {
          data {
            id
            name
            slug
            is_default
            is_final
            sequence
            order_type_id
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listOrderTypes(first = 50) {
    const query = `
      query ListOrderTypes($first: Int) {
        orderTypes(first: $first) {
          data {
            id
            name
            slug
            title
            total_statuses
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  async listRegions(first = 50) {
    const query = `
      query ListRegions($first: Int) {
        regions(first: $first) {
          data {
            id
            uuid
            name
            slug
            currency
            is_default
          }
        }
      }
    `;

    return this.client.query(query, { first });
  }

  // ── Write ──────────────────────────────────────────────────

  async createDraftOrder(input: CreateDraftOrderInput) {
    const mutation = `
      mutation CreateDraftOrder($input: DraftOrderInput!) {
        createDraftOrder(input: $input) {
          id
          uuid
          order_number
          status
          total_gross_amount
          total_net_amount
          created_at
        }
      }
    `;

    return this.client.query(mutation, { input });
  }

  async updateOrder(id: string, input: UpdateOrderInput) {
    const mutation = `
      mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) {
        updateOrder(id: $id, input: $input) {
          order {
            id
            uuid
            order_number
            status
            fulfillment_status
            payment_status
            total_gross_amount
          }
          message
        }
      }
    `;

    return this.client.query(mutation, { id, input });
  }

  async updateDraftOrderStatus(orderId: string, status: DraftOrderStatus) {
    const mutation = `
      mutation UpdateDraftOrderStatus($order_id: ID!, $status: OrderStatusEnum!) {
        updateDraftOrderStatus(order_id: $order_id, status: $status) {
          id
          uuid
          order_number
          status
        }
      }
    `;

    return this.client.query(mutation, { order_id: orderId, status });
  }

  async transitionOrderStatus(orderId: string, statusSlug?: string, date?: string) {
    const mutation = `
      mutation TransitionOrderStatus($input: TransitionOrderStatusInput!) {
        transitionOrderStatus(input: $input) {
          status
          message
        }
      }
    `;

    return this.client.query(mutation, {
      input: { order_id: orderId, status_slug: statusSlug, date },
    });
  }

  async changeOrderCustomer(orderId: string, customerId: string) {
    const mutation = `
      mutation OrderChangeCustomer($order_id: ID!, $customer_id: ID!) {
        orderChangeCustomer(order_id: $order_id, customer_id: $customer_id)
      }
    `;

    return this.client.queryWithAppKey(mutation, {
      order_id: orderId,
      customer_id: customerId,
    });
  }

  async deleteOrder(id: string) {
    const mutation = `
      mutation DeleteOrder($id: ID!) {
        deleteOrder(id: $id)
      }
    `;

    return this.client.query(mutation, { id });
  }

  async sendOrderEmail(orderId: string, template?: string) {
    const mutation = `
      mutation SendOrderEmail($order_id: ID!, $template: String) {
        sendOrderEmail(order_id: $order_id, template: $template)
      }
    `;

    return this.client.queryWithAppKey(mutation, {
      order_id: orderId,
      template,
    });
  }
}
