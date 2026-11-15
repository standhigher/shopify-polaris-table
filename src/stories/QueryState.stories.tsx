import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {
  applyFilterPreset,
  createProductColumns,
  decodeTableQuery,
  encodeTableQuery,
  reconcileVisibleColumnState,
  sanitizeVisibleColumnKeys,
  createTableViewManager,
} from '../index';
import type {TableQuery} from '../types';
import type {TableViewRepository} from '../views/tableViews';

const meta = {
  title: 'Integration features/Query State',
  parameters: {
    docs: {
      description: {
        component: 'Query-state stories show URL encoding, saved views, filter presets, and visible-column persistence.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const baseQuery: TableQuery = {
  page: 2,
  pageSize: 25,
  search: 'shoe',
  filters: {status: {operator: 'equals', value: 'Active'}},
};

export const UrlState: Story = {
  name: 'URL State',
  render: () => {
    const [query, setQuery] = useState(baseQuery);
    const encoded = useMemo(() => encodeTableQuery(query, {filterKeys: ['status']}), [query]);
    const decoded = useMemo(() => decodeTableQuery(encoded, {filterKeys: ['status'], pageSizeOptions: [25, 50, 100]}), [encoded]);

    return <s-section>
      <s-paragraph>Encode and decode query state with an allowlist.</s-paragraph>
      <pre>{encoded.toString()}</pre>
      <pre>{JSON.stringify(decoded, null, 2)}</pre>
      <s-button-group>
        <s-button onClick={() => setQuery((current) => applyFilterPreset(current, {id: 'active', label: 'Active', filters: {status: {operator: 'equals', value: 'Active'}}}))}>Apply filter preset</s-button>
        <s-button onClick={() => setQuery({page: 1, pageSize: 50, search: 'cap'})}>Reset query</s-button>
      </s-button-group>
    </s-section>;
  },
};

export const SavedViews: Story = {
  name: 'Saved Views',
  render: () => {
    const repository: TableViewRepository = {
      list: async () => [],
      create: async (input) => ({id: 'v_1', updatedAt: '2026-08-14T00:00:00.000Z', ...input}),
      update: async (input) => ({id: input.id, name: input.name ?? 'Saved view', query: input.query ?? baseQuery, visibleColumnKeys: input.visibleColumnKeys ?? ['title'], owner: 'u_1', updatedAt: input.updatedAt ?? '2026-08-14T00:00:00.000Z'}),
      remove: async () => undefined,
    };
    const manager = createTableViewManager(repository);
    const [state, setState] = useState('Ready to save a view.');
    const [visibleColumnKeys, setVisibleColumnKeys] = useState(['title', 'status', 'inventory', 'price']);
    const schemaColumns = createProductColumns();
    const reconciled = reconcileVisibleColumnState({
      columns: schemaColumns,
      visibleColumnKeys,
      query: baseQuery,
    });

    return <s-section>
      <s-paragraph>Saved views stay outside the table; the manager just tracks repository state.</s-paragraph>
      <pre>{state}</pre>
      <pre>{JSON.stringify(sanitizeVisibleColumnKeys(visibleColumnKeys, schemaColumns), null, 2)}</pre>
      <s-button-group>
        <s-button onClick={async () => { await manager.create({name: 'Active products', query: baseQuery, visibleColumnKeys, owner: 'u_1'}); setState('View created'); }}>Create view</s-button>
        <s-button onClick={() => setVisibleColumnKeys(['title', 'price'])}>Remove hidden columns</s-button>
      </s-button-group>
      <pre>{JSON.stringify(reconciled, null, 2)}</pre>
    </s-section>;
  },
};

export const VisibleColumns: Story = {
  name: 'Visible Columns',
  render: () => {
    const columns = createProductColumns();
    const keys = columns.map((column) => column.key);
    return <s-section>
      <s-paragraph>Column visibility is reconciled against the current schema.</s-paragraph>
      <pre>{JSON.stringify(keys, null, 2)}</pre>
      <pre>{JSON.stringify(sanitizeVisibleColumnKeys(['title', 'status', 'unknown'], columns), null, 2)}</pre>
    </s-section>;
  },
};
