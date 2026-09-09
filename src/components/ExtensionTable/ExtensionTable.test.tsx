import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../../test/setup';
import {ExtensionTable} from './ExtensionTable';

const rows = [{id: 'one', title: 'First', status: 'Active'}, {id: 'two', title: 'Second', status: 'Draft'}];
const columns = [
  {key: 'title', title: 'Title', render: ({row}: {row: (typeof rows)[number]}) => row.title},
  {key: 'status', title: 'Status', type: 'status' as const, render: ({row}: {row: (typeof rows)[number]}) => row.status},
  {key: 'extra', title: 'Extra', render: () => 'Extra'},
  {key: 'hidden', title: 'Hidden', render: () => 'Hidden'},
] as const;

describe('ExtensionTable', () => {
  it('uses a capped compact layout and only enables capabilities supplied by the host', async () => {
    const onSelectionChange = vi.fn();
    const perform = vi.fn();
    const onLoadMore = vi.fn();
    render(<ExtensionTable
      columns={columns}
      data={rows}
      rowId="id"
      host={{locale: 'en', timeZone: 'UTC', capabilities: {selection: true, rowActions: true, loadMore: true}}}
      compact
      selectedRowId="one"
      onSelectionChange={onSelectionChange}
      rowAction={{content: 'Open', perform}}
      hasMore
      onLoadMore={onLoadMore}
    />);

    expect(screen.getByRole('columnheader', {name: 'Title'})).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', {name: 'Hidden'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', {name: 'Select two'}));
    expect(onSelectionChange).toHaveBeenCalledWith('two');
    fireEvent.click(screen.getAllByRole('button', {name: 'Open'})[0]!);
    expect(perform).toHaveBeenCalledWith({row: rows[0], rowId: 'one', host: {locale: 'en', timeZone: 'UTC', capabilities: {selection: true, rowActions: true, loadMore: true}}});
    fireEvent.click(screen.getByRole('button', {name: 'Load more'}));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('degrades to read-only and renders state slots without Admin controls', () => {
    const onRetry = vi.fn();
    const {rerender} = render(<ExtensionTable
      columns={columns}
      data={rows}
      rowId="id"
      host={{locale: 'en', timeZone: 'UTC', capabilities: {loadMore: false}}}
      readOnly
      onSelectionChange={() => undefined}
      rowAction={{content: 'Open', perform: () => undefined}}
      hasMore
      onLoadMore={() => undefined}
    />);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Open'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Load more'})).not.toBeInTheDocument();

    rerender(<ExtensionTable columns={columns} data={rows} rowId="id" host={{locale: 'en', timeZone: 'UTC'}} readOnly hasMore onLoadMore={() => undefined} />);
    expect(screen.getByRole('button', {name: 'Load more'})).toBeInTheDocument();

    rerender(<ExtensionTable columns={columns} data={[]} rowId="id" host={{locale: 'en', timeZone: 'UTC'}} error="Request failed" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(<ExtensionTable columns={columns} data={[]} rowId="id" host={{locale: 'en', timeZone: 'UTC'}} loadingState="Loading extension" loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading extension');
  });

  it('surfaces failed row actions and failed load-more requests', async () => {
    render(<ExtensionTable
      columns={columns}
      data={rows}
      rowId="id"
      host={{locale: 'en', timeZone: 'UTC'}}
      rowAction={{content: 'Open', perform: async () => { throw new Error('Action denied'); }}}
      hasMore
      onLoadMore={async () => { throw new Error('No connection'); }}
    />);
    fireEvent.click(screen.getAllByRole('button', {name: 'Open'})[0]!);
    fireEvent.click(screen.getByRole('button', {name: 'Load more'}));
    expect(await screen.findByText('Action denied')).toBeInTheDocument();
    expect(await screen.findByText('No connection')).toBeInTheDocument();
  });

  it('accepts host-owned labels for its built-in UI', () => {
    render(<ExtensionTable
      columns={columns}
      data={[]}
      rowId="id"
      host={{locale: 'zh-CN', timeZone: 'UTC'}}
      labels={{noResults: '暂无结果', loading: '正在加载…', retry: '重试'}}
    />);
    expect(screen.getByText('暂无结果')).toBeInTheDocument();
  });
});
