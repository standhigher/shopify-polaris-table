import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {render} from '../../test/setup';
import type {TableProps, TableQuery} from '../../types';
import {Table} from './Table';

type Row = {id: string; name: string; amount: number};
const query: TableQuery = {page: 2, pageSize: 10, search: 'shoe', sort: {field: 'name', direction: 'asc'}, filters: {name: {operator: 'contains', value: 'shoe'}}};
const props: TableProps<Row> = {
  columns: [{key: 'name', title: 'Name', sortable: true}, {key: 'amount', title: 'Amount'}], data: [{id: 'a', name: 'Shoe', amount: 1}],
  rowId: 'id', query, pagination: {total: 25}, selection: {mode: 'explicit', ids: []}, formatOptions: {locale: 'en-US', timeZone: 'UTC'},
  onQueryChange: vi.fn(), onSelectionChange: vi.fn(),
};

describe('Table controlled query integration', () => {
  it('handles native pagination while preserving all criteria and rejects loading events', () => {
    const onQueryChange = vi.fn();
    const {container, rerender} = render(<Table {...props} onQueryChange={onQueryChange} />);
    const table = container.querySelector('s-table')!;
    expect(table).toHaveProperty('hasPreviousPage', true);
    expect(table).toHaveProperty('hasNextPage', true);
    fireEvent(table, new Event('nextpage'));
    expect(onQueryChange).toHaveBeenLastCalledWith({...query, page: 3});
    fireEvent(table, new Event('previouspage'));
    expect(onQueryChange).toHaveBeenLastCalledWith({...query, page: 1});
    onQueryChange.mockClear();
    rerender(<Table {...props} loading onQueryChange={onQueryChange} />);
    expect(table).toHaveProperty('hasNextPage', false);
    fireEvent(table, new Event('nextpage'));
    fireEvent(table, new Event('previouspage'));
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('rejects out-of-bound pagination and invalid sorting choices', () => {
    const onQueryChange = vi.fn();
    const {container} = render(<Table {...props} query={{page: 1, pageSize: 10}} pagination={{total: 1}} onQueryChange={onQueryChange} />);
    const table = container.querySelector('s-table')!;
    fireEvent(table, new Event('nextpage'));
    fireEvent(table, new Event('previouspage'));
    fireEvent.change(screen.getByRole('combobox', {name: 'Sort by'}), {target: {value: 'amount'}});
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('resets page for direction and page-size changes and exposes a declared allowlist', () => {
    const onQueryChange = vi.fn();
    render(<Table {...props} pageSizeOptions={[10, 20]} onQueryChange={onQueryChange} />);
    fireEvent.change(screen.getByRole('combobox', {name: 'Sort direction'}), {target: {value: 'invalid'}});
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('combobox', {name: 'Sort direction'}), {target: {value: 'desc'}});
    expect(onQueryChange).toHaveBeenLastCalledWith({...query, page: 1, sort: {field: 'name', direction: 'desc'}});
    fireEvent.change(screen.getByRole('combobox', {name: 'Items per page'}), {target: {value: '20'}});
    expect(onQueryChange).toHaveBeenLastCalledWith({...query, page: 1, pageSize: 20});
  });

  it('resets pagination when visibility reconciliation removes query criteria', () => {
    const onQueryChange = vi.fn();
    render(<Table {...props} visibleColumnKeys={['amount']} onQueryChange={onQueryChange} />);
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 10, search: 'shoe'});
  });
});
