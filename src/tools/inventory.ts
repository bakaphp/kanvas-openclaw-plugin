import { InventoryService } from "../domains/inventory/index.js";

export function createInventoryTools(service: InventoryService) {
  return {
    kanvas_search_products: (search: string, first?: number) => service.searchProducts(search, first),
    kanvas_get_product: (id: string) => service.getProduct(id),
  };
}
