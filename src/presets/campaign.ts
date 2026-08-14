import type {TableColumn} from '../types';

export interface CampaignRow {
  id: string;
  name: string;
  channel?: string;
  status?: string;
  budget?: number;
  spend?: number;
  currencyCode?: string;
  startsAt?: string;
  endsAt?: string;
}

export type CampaignColumnOverrides = Partial<Record<'name' | 'channel' | 'status' | 'budget' | 'spend' | 'startsAt' | 'endsAt', Partial<TableColumn<CampaignRow>>>>;

export function createCampaignColumns(overrides: CampaignColumnOverrides = {}): readonly TableColumn<CampaignRow>[] {
  return [
    {key: 'name', title: 'Campaign', type: 'text', sortable: true, ...overrides.name},
    {key: 'channel', title: 'Channel', type: 'text', sortable: true, ...overrides.channel},
    {key: 'status', title: 'Status', type: 'status', sortable: true, ...overrides.status},
    {key: 'budget', title: 'Budget', type: 'money', align: 'end', currencyCode: (row) => row.currencyCode, ...overrides.budget},
    {key: 'spend', title: 'Spend', type: 'money', align: 'end', currencyCode: (row) => row.currencyCode, ...overrides.spend},
    {key: 'startsAt', title: 'Starts', type: 'datetime', sortable: true, ...overrides.startsAt},
    {key: 'endsAt', title: 'Ends', type: 'datetime', sortable: true, ...overrides.endsAt},
  ] as TableColumn<CampaignRow>[];
}
