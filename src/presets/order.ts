import type {TableColumn} from '../types';

export interface OrderRow {
  id: string;
  name: string;
  customerName?: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  total?: number;
  currencyCode?: string;
  createdAt?: string;
}

export type OrderColumnOverrides = Partial<Record<'name' | 'customerName' | 'financialStatus' | 'fulfillmentStatus' | 'total' | 'createdAt', Partial<TableColumn<OrderRow>>>>;

export function createOrderColumns(overrides: OrderColumnOverrides = {}): readonly TableColumn<OrderRow>[] {
  return [
    {key: 'name', title: 'Order', type: 'text', sortable: true, ...overrides.name},
    {key: 'customerName', title: 'Customer', type: 'text', sortable: true, ...overrides.customerName},
    {key: 'financialStatus', title: 'Payment', type: 'status', ...overrides.financialStatus},
    {key: 'fulfillmentStatus', title: 'Fulfillment', type: 'status', ...overrides.fulfillmentStatus},
    {key: 'total', title: 'Total', type: 'money', align: 'end', currencyCode: (row) => row.currencyCode, ...overrides.total},
    {key: 'createdAt', title: 'Date', type: 'datetime', sortable: true, ...overrides.createdAt},
  ] as TableColumn<OrderRow>[];
}
