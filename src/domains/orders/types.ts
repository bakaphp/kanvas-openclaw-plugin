export interface OrderLineItemInput {
  variant_id: string | number;
  quantity: number;
  price?: number | string;
  metadata?: Record<string, unknown>;
  channel_id?: string | number;
}

export interface OrderBillingInput {
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderAddressInput {
  address: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  is_default?: boolean;
}

export interface OrderCustomerInput {
  id?: string | number;
  firstname: string;
  lastname?: string;
  contacts?: Array<{ value: string; contacts_types_id: number; weight?: number }>;
  address?: OrderAddressInput[];
}

export interface CreateDraftOrderInput {
  email: string;
  phone?: string;
  customer: OrderCustomerInput;
  region_id: string | number;
  billing_address?: OrderBillingInput;
  shipping_address?: OrderAddressInput;
  items: OrderLineItemInput[];
  note?: string;
  metadata?: Record<string, unknown>;
  channel_id?: string | number;
}

export interface UpdateOrderInput {
  items?: OrderLineItemInput[];
  fulfillment_status?: string;
  status?: string;
  payment_status?: string;
  metadata?: Record<string, unknown>;
  metadata_action?: "MERGE" | "REPLACE";
}

export type DraftOrderStatus = "PENDING" | "COMPLETED" | "DRAFT" | "CANCELED" | "FAILED";
