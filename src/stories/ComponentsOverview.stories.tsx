import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {Table, createOrderColumns} from '../index';
import type {TableQuery, TableSelection} from '../types';
import {storyOrders} from './storyData';
import {defaultFormatOptions} from './storyTableHelpers';

const meta = {
  title: 'Components/Overview',
  parameters: {
    docs: {
      description: {
        component: 'Component-level stories start here: a live controlled table with concrete server-style state.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const LiveTablePreview: Story = {
  name: 'Live Table Preview',
  render: () => {
    const query: TableQuery = {page: 1, pageSize: 5, search: '10'};
    const selection: TableSelection = {mode: 'explicit', ids: ['o_1', 'o_2']};

    return <Card>
      <Text as="p" variant="bodyMd">A component story should show the real table people embed in their app.</Text>
      <Table
        columns={createOrderColumns({
          financialStatus: {statusTone: {Paid: 'success', Pending: 'warning', Refunded: 'critical'}},
          fulfillmentStatus: {statusTone: {Fulfilled: 'success', Partial: 'warning', Unfulfilled: 'info'}},
        })}
        data={storyOrders.slice(0, 5)}
        rowId="id"
        query={query}
        pagination={{total: storyOrders.length}}
        formatOptions={defaultFormatOptions}
        selection={selection}
        onSelectionChange={() => undefined}
        onQueryChange={() => undefined}
      />
    </Card>;
  },
};
