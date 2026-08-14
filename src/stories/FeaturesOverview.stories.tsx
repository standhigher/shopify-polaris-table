import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {Table, createOrderColumns} from '../index';
import type {TableSelection} from '../types';
import {storyOrders} from './storyData';
import {defaultFormatOptions, explicitSelection, useStoryTable} from './storyTableHelpers';

const meta = {
  title: 'Features/Overview',
  parameters: {
    docs: {
      description: {
        component: 'Feature stories show the table behaviors that sit around the data grid: selection, query state, and bulk actions.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SelectionAndQueryPreview: Story = {
  name: 'Selection and Query Preview',
  render: () => {
    const {query, setQuery, selection, setSelection, visiblePage} = useStoryTable(storyOrders, 5);
    const previewSelection: TableSelection = selection.mode === 'explicit' ? selection : explicitSelection;

    return <Card>
      <Text as="p" variant="bodyMd">Feature stories should show how state changes around the table, not just the contract.</Text>
      <Table
        columns={createOrderColumns({
          financialStatus: {statusTone: {Paid: 'success', Pending: 'warning', Refunded: 'critical'}},
          fulfillmentStatus: {statusTone: {Fulfilled: 'success', Partial: 'warning', Unfulfilled: 'info'}},
        })}
        data={visiblePage.data}
        rowId="id"
        query={query}
        pagination={{total: visiblePage.total}}
        formatOptions={defaultFormatOptions}
        selection={previewSelection}
        onSelectionChange={setSelection}
        onQueryChange={setQuery}
        onSelectAllMatching={async (currentQuery) => ({
          selectionToken: 'overview-selection-token',
          normalizedQuery: currentQuery,
          selectedCount: storyOrders.length,
          expiresAt: '2026-12-31T23:59:59.000Z',
        })}
      />
    </Card>;
  },
};
