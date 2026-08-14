import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {Table, createOrderColumns} from '../index';
import {storyOrders} from './storyData';
import {defaultFormatOptions, useStoryTable} from './storyTableHelpers';

const meta = {
  title: 'Presets/Overview',
  parameters: {
    docs: {
      description: {
        component: 'Preset stories should feel like ready-to-use business tables, not just column factory signatures.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const OrderPresetPreview: Story = {
  name: 'Order Preset Preview',
  render: () => {
    const {query, setQuery, selection, setSelection, visiblePage} = useStoryTable(storyOrders, 5);

    return <Card>
      <Text as="p" variant="bodyMd">Presets are the quickest way to see a complete domain table with the right columns and tones already wired.</Text>
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
        selection={selection}
        onSelectionChange={setSelection}
        onQueryChange={setQuery}
      />
    </Card>;
  },
};
