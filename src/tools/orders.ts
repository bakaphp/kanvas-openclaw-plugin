import { OrdersService } from "../domains/orders/index.js";

export function createOrdersTools(service: OrdersService) {
  return {
    kanvas_search_orders: (search: string, first?: number) => service.searchOrders(search, first),
    kanvas_get_order: (id: string) => service.getOrder(id),
  };
}
