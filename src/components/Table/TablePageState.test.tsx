import {useState} from 'react';
import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {render} from '../../test/setup';
import {Table} from './Table';
import {TableSkeleton} from './TableSkeleton';
import type {TableColumn, TableProps} from '../../types';

type Row = {id: string; name: string; amount: number};
const columns: readonly TableColumn<Row>[] = [{key: 'name', title: 'Name', listSlot: 'primary'}, {key: 'amount', title: 'Amount', type: 'number'}];
const props: TableProps<Row> = {
  columns, data: [{id: 'a', name: 'Shoe', amount: 2}], rowId: 'id', query: {page: 1, pageSize: 10}, pagination: {total: 1},
  selection: {mode: 'explicit', ids: []}, formatOptions: {locale: 'en-US', timeZone: 'UTC'}, onQueryChange: vi.fn(), onSelectionChange: vi.fn(),
};
function StatefulCell() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((value) => value + 1)}>{`Counter ${count}`}</button>;
}

describe('Table page states', () => {
  it('shows a bounded, inert skeleton only when loading without rows', () => {
    const {container} = render(<Table {...props} data={[]} loading labels={{loading: 'Loading inventory'}} />);
    expect(screen.getByRole('status', {name: 'Loading inventory'})).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"][inert]')).toBeInTheDocument();
    expect(container.querySelectorAll('s-table-row')).toHaveLength(3);
    expect(container.querySelector('s-table')).not.toHaveAttribute('paginate');
    expect(container.querySelector('s-empty-state')).toBeNull();
    expect(screen.queryByText('Shoe')).not.toBeInTheDocument();
  });

  it('keeps existing rows and native loading without a second skeleton', () => {
    const onSelectionChange = vi.fn();
    const {container} = render(<Table {...props} loading onSelectionChange={onSelectionChange} />);
    expect(screen.getByText('Shoe')).toBeInTheDocument();
    expect(container.querySelectorAll('s-table-row')).toHaveLength(1);
    expect(container.querySelector('s-table')).toHaveProperty('loading', true);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.change(container.querySelector('s-checkbox')!, {target: {checked: true}});
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('retains rows on error and gates Retry while loading', () => {
    const retry = vi.fn();
    const {container, rerender} = render(<Table {...props} error="Refresh failed" onRetry={retry} />);
    expect(screen.getByText('Shoe')).toBeInTheDocument();
    expect(screen.getByText('Refresh failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    expect(retry).toHaveBeenCalledOnce();
    rerender(<Table {...props} error="Refresh failed" loading onRetry={retry} />);
    const button = container.querySelector('s-banner s-button')!;
    expect(button).toHaveProperty('disabled', true);
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledOnce();
    expect(container.querySelector('s-table')).toHaveProperty('loading', true);
  });

  it('does not combine error or empty with an empty rendered table', () => {
    const onQueryChange = vi.fn();
    const {container, rerender} = render(<Table {...props} data={[]} error="Request failed" onQueryChange={onQueryChange} />);
    expect(container.querySelector('s-table')).toBeNull();
    expect(container.querySelector('s-empty-state')).toBeNull();
    rerender(<Table {...props} data={[]} pagination={{total: 20}} onQueryChange={onQueryChange} />);
    expect(container.querySelector('s-empty-state')).toHaveAttribute('heading', 'No results');
    expect(container.querySelector('s-table')).toBeNull();
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('honors custom empty ReactNodes, including zero', () => {
    const {container, rerender} = render(<Table {...props} data={[]} pagination={{total: 0}} emptyState={<s-text>Custom empty</s-text>} />);
    expect(screen.getByText('Custom empty')).toBeInTheDocument();
    expect(container.querySelector('s-empty-state')).toBeNull();
    rerender(<Table {...props} data={[]} emptyState={0} />);
    expect(container).toHaveTextContent('0');
    expect(container.querySelector('s-empty-state')).toBeNull();
  });

  it('preserves custom cell identity through refresh and refresh errors', () => {
    const customColumns: readonly TableColumn<Row>[] = [{key: 'name', title: 'Name', type: 'custom', render: () => <StatefulCell />}];
    const {rerender} = render(<Table {...props} columns={customColumns} />);
    fireEvent.click(screen.getByRole('button', {name: 'Counter 0'}));
    rerender(<Table {...props} columns={customColumns} loading />);
    expect(screen.getByRole('button', {name: 'Counter 1'})).toBeInTheDocument();
    rerender(<Table {...props} columns={customColumns} error="Refresh failed" />);
    expect(screen.getByRole('button', {name: 'Counter 1'})).toBeInTheDocument();
  });

  it('does not duplicate a declared actions column in the skeleton', () => {
    const actionColumns: readonly TableColumn<Row>[] = [{key: 'name', title: 'Name'}, {key: 'actions', title: 'Operations', type: 'actions'}];
    const {container} = render(<Table {...props} columns={actionColumns} data={[]} loading rowActions={[{id: 'open', content: 'Open', perform: vi.fn()}]} />);
    expect(container.querySelectorAll('s-table-header')).toHaveLength(3);
    expect(container.querySelectorAll('s-table-row s-table-cell')).toHaveLength(9);
  });

  it('bounds standalone skeleton row counts without invoking custom cell renderers', () => {
    const custom = vi.fn();
    const customColumns: readonly TableColumn<Row>[] = [{key: 'name', title: <strong>Name</strong>, type: 'custom', render: custom}];
    const {container, rerender} = render(<TableSkeleton columns={customColumns} rowCount={500} />);
    expect(container.querySelectorAll('s-table-row')).toHaveLength(20);
    expect(custom).not.toHaveBeenCalled();
    rerender(<TableSkeleton columns={customColumns} rowCount={Number.NaN} />);
    expect(container.querySelectorAll('s-table-row')).toHaveLength(3);
  });
});
