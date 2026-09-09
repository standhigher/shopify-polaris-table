import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';

import {ExtensionTable} from '../index';

const rows = [
  {id: '1', title: 'Order #1001', status: 'Open'},
  {id: '2', title: 'Order #1002', status: 'Paid'},
];

const meta = {
  title: 'Components/ExtensionTable',
  parameters: {
    docs: {description: {component: 'A narrow-host renderer that keeps selection, actions, and cursor loading explicitly capability-gated.'}},
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompactAndCapabilityGated: Story = {
  render: () => {
    const [selectedRowId, setSelectedRowId] = useState<string>();
    return <ExtensionTable
      columns={[
        {key: 'title', title: 'Order', render: ({row}) => row.title},
        {key: 'status', title: 'Status', type: 'status', render: ({row}) => row.status},
      ]}
      data={rows}
      rowId="id"
      host={{locale: 'en', timeZone: 'UTC', capabilities: {selection: true, rowActions: true, loadMore: true}}}
      compact
      {...(selectedRowId ? {selectedRowId} : {})}
      onSelectionChange={setSelectedRowId}
      rowAction={{content: 'Open', perform: ({rowId}) => { console.info(`Open ${rowId}`); }}}
      hasMore
      onLoadMore={() => { console.info('Load the next cursor page'); }}
    />;
  },
};

export const ReadOnlyFallback: Story = {
  render: () => <ExtensionTable
    columns={[
      {key: 'title', title: 'Order', render: ({row}) => row.title},
      {key: 'status', title: 'Status', type: 'status', render: ({row}) => row.status},
    ]}
    data={rows}
    rowId="id"
    host={{locale: 'en', timeZone: 'UTC', capabilities: {selection: false, rowActions: false, loadMore: false}}}
    readOnly
    rowAction={{content: 'Open', perform: () => undefined}}
    hasMore
    onLoadMore={() => undefined}
  />,
};
