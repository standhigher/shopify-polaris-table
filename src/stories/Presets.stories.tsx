import type {Meta, StoryObj} from '@storybook/react-vite';

import {
  Table,
  createCampaignColumns,
  createCustomerColumns,
  createOfferColumns,
  createOrderColumns,
  createProductColumns,
} from '../index';
import type {TableColumn} from '../types';
import {
  storyCampaigns,
  storyCustomers,
  storyOffers,
  storyOrders,
  storyProducts,
} from './storyData';
import {defaultFormatOptions, useStoryTable} from './storyTableHelpers';

const meta = {
  title: 'Presets',
  parameters: {
    docs: {
      description: {
        component: 'Domain presets provide ready-to-override columns for common Shopify admin tables.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function PresetTable<T extends {id: string}>({
  rows,
  columns,
}: {
  rows: readonly T[];
  columns: readonly TableColumn<T>[];
}) {
  const {query, setQuery, selection, setSelection, visiblePage} = useStoryTable(rows);

  return <Table
    columns={columns}
    data={visiblePage.data}
    rowId={(row) => row.id}
    query={query}
    pagination={{total: visiblePage.total}}
    formatOptions={defaultFormatOptions}
    selection={selection}
    onSelectionChange={setSelection}
    onQueryChange={setQuery}
  />;
}

export const ProductTable: Story = {
  name: 'ProductTable',
  render: () => <PresetTable rows={storyProducts} columns={createProductColumns({
    status: {statusTone: {Active: 'success', Draft: 'info'}},
  })} />,
};

export const OrderTable: Story = {
  name: 'OrderTable',
  render: () => <PresetTable rows={storyOrders} columns={createOrderColumns({
    financialStatus: {statusTone: {Paid: 'success', Pending: 'warning', Refunded: 'critical'}},
    fulfillmentStatus: {statusTone: {Fulfilled: 'success', Partial: 'warning', Unfulfilled: 'info'}},
  })} />,
};

export const CustomerTable: Story = {
  name: 'CustomerTable',
  render: () => <PresetTable rows={storyCustomers} columns={createCustomerColumns()} />,
};

export const CampaignTable: Story = {
  name: 'CampaignTable',
  render: () => <PresetTable rows={storyCampaigns} columns={createCampaignColumns({
    status: {statusTone: {Active: 'success', Paused: 'warning', Draft: 'info'}},
  })} />,
};

export const OfferTable: Story = {
  name: 'OfferTable',
  render: () => <PresetTable rows={storyOffers} columns={createOfferColumns({
    status: {statusTone: {Active: 'success', Scheduled: 'info'}},
  })} />,
};
