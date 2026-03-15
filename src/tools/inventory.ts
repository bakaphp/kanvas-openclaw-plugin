import { InventoryService } from "../domains/inventory/index.js";

export function createInventoryTools(service: InventoryService) {
  return {
    kanvas_search_products: (search: string, first?: number) => service.searchProducts(search, first),
    kanvas_get_product: (id: string) => service.getProduct(id),
    kanvas_list_variants: (first?: number, where?: Array<Record<string, unknown>>) =>
      service.listVariants(first, where),
    kanvas_list_warehouses: (first?: number, where?: Array<Record<string, unknown>>) =>
      service.listWarehouses(first, where),
    kanvas_list_channels: (first?: number, where?: Array<Record<string, unknown>>) =>
      service.listChannels(first, where),
    kanvas_list_categories: (first?: number, where?: Array<Record<string, unknown>>) =>
      service.listCategories(first, where),
    kanvas_list_inventory_statuses: (first?: number, where?: Array<Record<string, unknown>>) =>
      service.listStatuses(first, where),
  };
}
