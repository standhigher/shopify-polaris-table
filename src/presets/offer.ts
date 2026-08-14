import type {TableColumn} from '../types';

export interface OfferRow {
  id: string;
  name: string;
  type?: string;
  status?: string;
  discount?: number;
  currencyCode?: string;
  startsAt?: string;
  endsAt?: string;
}

export type OfferColumnOverrides = Partial<Record<'name' | 'type' | 'status' | 'discount' | 'startsAt' | 'endsAt', Partial<TableColumn<OfferRow>>>>;

export function createOfferColumns(overrides: OfferColumnOverrides = {}): readonly TableColumn<OfferRow>[] {
  return [
    {key: 'name', title: 'Offer', type: 'text', sortable: true, ...overrides.name},
    {key: 'type', title: 'Type', type: 'text', sortable: true, ...overrides.type},
    {key: 'status', title: 'Status', type: 'status', sortable: true, ...overrides.status},
    {key: 'discount', title: 'Discount', type: 'money', align: 'end', currencyCode: (row) => row.currencyCode, ...overrides.discount},
    {key: 'startsAt', title: 'Starts', type: 'datetime', sortable: true, ...overrides.startsAt},
    {key: 'endsAt', title: 'Ends', type: 'datetime', sortable: true, ...overrides.endsAt},
  ] as TableColumn<OfferRow>[];
}
