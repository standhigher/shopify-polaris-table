import type {TableColumn} from '../types';

export interface CustomerRow {
  id: string;
  name: string;
  email?: string;
  ordersCount?: number;
  totalSpent?: number;
  currencyCode?: string;
  createdAt?: string;
}

export type CustomerColumnOverrides = Partial<Record<'name' | 'email' | 'ordersCount' | 'totalSpent' | 'createdAt', Partial<TableColumn<CustomerRow>>>>;

export function createCustomerColumns(overrides: CustomerColumnOverrides = {}): readonly TableColumn<CustomerRow>[] {
  return [
    {key: 'name', title: 'Customer', type: 'text', sortable: true, ...overrides.name},
    {key: 'email', title: 'Email', type: 'text', ...overrides.email},
    {key: 'ordersCount', title: 'Orders', type: 'number', align: 'end', sortable: true, ...overrides.ordersCount},
    {key: 'totalSpent', title: 'Amount spent', type: 'money', align: 'end', currencyCode: (row) => row.currencyCode, ...overrides.totalSpent},
    {key: 'createdAt', title: 'Customer since', type: 'datetime', sortable: true, ...overrides.createdAt},
  ] as TableColumn<CustomerRow>[];
}
