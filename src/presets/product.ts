import type {TableColumn} from '../types';

export interface ProductRow {
  id: string;
  title: string;
  status?: string;
  inventory?: number;
  price?: number;
  currencyCode?: string;
  imageUrl?: string;
  updatedAt?: string;
}

export type ProductColumnOverrides = Partial<Record<'title' | 'status' | 'inventory' | 'price' | 'updatedAt', Partial<TableColumn<ProductRow>>>>;

export function createProductColumns(overrides: ProductColumnOverrides = {}): readonly TableColumn<ProductRow>[] {
  return [
    {key: 'title', title: 'Product', type: 'text', sortable: true, ...overrides.title},
    {key: 'status', title: 'Status', type: 'status', sortable: true, ...overrides.status},
    {key: 'inventory', title: 'Inventory', type: 'number', align: 'end', sortable: true, ...overrides.inventory},
    {key: 'price', title: 'Price', type: 'money', align: 'end', currencyCode: (row) => row.currencyCode, ...overrides.price},
    {key: 'updatedAt', title: 'Updated', type: 'datetime', sortable: true, ...overrides.updatedAt},
  ] as TableColumn<ProductRow>[];
}
