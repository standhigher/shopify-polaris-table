import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';
import {expect, userEvent, within} from 'storybook/test';

import {ExtensionTable} from '../index';
import {useStorybookCopy} from './storybookI18n';

const rows = [
  {id: '1', title: 'Order #1001', status: 'Open'},
  {id: '2', title: 'Order #1002', status: 'Paid'},
];

type PlaygroundArgs = {compact: boolean; readOnly: boolean; loading: boolean; hasMore: boolean};

function useExtensionLabels() {
  const {text} = useStorybookCopy();
  return {
    table: text('Extension table', '扩展表格'), select: text('Select', '选择'), selectRow: (id: string) => text(`Select ${id}`, `选择 ${id}`),
    action: text('Action', '操作'), loading: text('Loading…', '正在加载…'), noResults: text('No results', '暂无结果'), retry: text('Retry', '重试'),
    actionFailed: text('Action failed', '操作失败'), loadMore: text('Load more', '加载更多'), loadMoreFailed: text('Could not load more rows', '无法加载更多行'),
  };
}

function ExtensionTablePlayground({compact, readOnly, loading, hasMore}: PlaygroundArgs) {
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const labels = useExtensionLabels();
  const {locale} = useStorybookCopy();

  return <ExtensionTable
    columns={[
      {key: 'title', title: 'Order', render: ({row}) => row.title},
      {key: 'status', title: 'Status', type: 'status', render: ({row}) => row.status},
    ]}
    data={rows}
    rowId="id"
    host={{locale, timeZone: 'UTC', capabilities: {selection: true, rowActions: true, loadMore: true}}}
    compact={compact}
    readOnly={readOnly}
    loading={loading}
    labels={labels}
    {...(selectedRowId ? {selectedRowId} : {})}
    onSelectionChange={setSelectedRowId}
    rowAction={{content: 'Open', perform: () => undefined}}
    hasMore={hasMore}
    onLoadMore={() => undefined}
  />;
}

const meta = {
  title: 'Components/Extension Table',
  component: ExtensionTablePlayground,
  parameters: {
    docs: {description: {component: 'A narrow-host renderer. Selection, row actions, and cursor loading remain capability-gated and never read Admin routing or shop globals.'}},
  },
  argTypes: {
    compact: {control: 'boolean'},
    readOnly: {control: 'boolean'},
    loading: {control: 'boolean'},
    hasMore: {control: 'boolean'},
  },
} satisfies Meta<typeof ExtensionTablePlayground>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  args: {compact: true, readOnly: false, loading: false, hasMore: true},
  render: (args) => <ExtensionTablePlayground {...args} />,
};

export const CompactAndCapabilityGated: Story = {
  render: () => <ExtensionTablePlayground compact readOnly={false} loading={false} hasMore />,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', {name: 'Select 2'}));
    await expect(canvas.getByRole('radio', {name: 'Select 2'})).toBeChecked();
  },
};

export const ReadOnlyFallback: Story = {
  render: () => {
    const labels = useExtensionLabels();
    const {locale} = useStorybookCopy();
    return <ExtensionTable
      columns={[
        {key: 'title', title: 'Order', render: ({row}) => row.title},
        {key: 'status', title: 'Status', type: 'status', render: ({row}) => row.status},
      ]}
      data={rows}
      rowId="id"
      host={{locale, timeZone: 'UTC', capabilities: {selection: false, rowActions: false, loadMore: false}}}
      labels={labels}
      readOnly
      rowAction={{content: 'Open', perform: () => undefined}}
      hasMore
      onLoadMore={() => undefined}
    />;
  },
};

export const Loading: Story = {
  render: () => {
    const labels = useExtensionLabels();
    const {locale} = useStorybookCopy();
    return <ExtensionTable columns={[]} data={[]} rowId="id" host={{locale, timeZone: 'UTC'}} loading labels={labels} />;
  },
};

export const Empty: Story = {
  render: () => {
    const labels = useExtensionLabels();
    const {locale} = useStorybookCopy();
    return <ExtensionTable columns={[]} data={[]} rowId="id" host={{locale, timeZone: 'UTC'}} labels={labels} />;
  },
};

export const ErrorAndRetry: Story = {
  render: () => {
    const [error, setError] = useState<string | undefined>('Could not load the extension data.');
    const labels = useExtensionLabels();
    const {locale, text} = useStorybookCopy();
    return <ExtensionTable columns={[]} data={[]} rowId="id" host={{locale, timeZone: 'UTC'}} labels={labels} {...(error ? {error} : {})} onRetry={() => setError(undefined)} emptyState={text('Request recovered.', '请求已恢复。')} />;
  },
};

export const LoadMoreFailure: Story = {
  render: () => {
    const labels = useExtensionLabels();
    const {locale, text} = useStorybookCopy();
    return <ExtensionTable
      columns={[{key: 'title', title: 'Order', render: ({row}) => row.title}]}
      data={rows}
      rowId="id"
      host={{locale, timeZone: 'UTC', capabilities: {loadMore: true}}}
      labels={labels}
      hasMore
      onLoadMore={async () => { throw new Error(text('Network unavailable.', '网络不可用。')); }}
    />;
  },
};

export const RowActionFailure: Story = {
  render: () => {
    const labels = useExtensionLabels();
    const {locale, text} = useStorybookCopy();
    return <ExtensionTable
      columns={[{key: 'title', title: 'Order', render: ({row}) => row.title}]}
      data={rows}
      rowId="id"
      host={{locale, timeZone: 'UTC', capabilities: {rowActions: true}}}
      labels={labels}
      rowAction={{content: text('Open', '打开'), perform: async () => { throw new Error(text('Could not open the order.', '无法打开订单。')); }}}
    />;
  },
};
