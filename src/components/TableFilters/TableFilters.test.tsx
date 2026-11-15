import {act, fireEvent, waitFor} from '@testing-library/react';
import {render} from '../../test/setup';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {TableFilters} from './TableFilters';
import type {TableFilterDefinition, TableQuery} from '../../types/table';

afterEach(() => vi.useRealTimers());

describe('TableFilters', () => {
  it('writes typed search and filter values while resetting page', async () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = {page: 3, pageSize: 20};
    const filters: TableFilterDefinition[] = [
      {key: 'status', label: 'Status', type: 'select', operators: ['equals'], options: [{label: 'Active', value: 'active'}]},
      {key: 'enabled', label: 'Enabled', type: 'boolean', operators: ['equals']},
    ];
    const {container} = render(<TableFilters query={query} filters={filters} onQueryChange={onQueryChange} searchDebounceMs={0} />);
    const search = container.querySelector('s-search-field');
    expect(search).not.toBeNull();
    fireEvent.input(search!, {target: {value: 'shoe'}});
    await waitFor(() => expect(onQueryChange).toHaveBeenCalledWith({...query, page: 1, search: 'shoe'}));
  });

  it('removes empty values without dropping false', () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = {page: 2, pageSize: 10, filters: {enabled: {operator: 'equals', value: true}}};
    const {container} = render(
      <TableFilters
        query={query}
        filters={[{key: 'enabled', label: 'Enabled', type: 'boolean', operators: ['equals']}]}
        onQueryChange={onQueryChange}
        searchDebounceMs={0}
      />,
    );
    const checkbox = container.querySelector('s-checkbox');
    expect(checkbox).not.toBeNull();
    fireEvent.change(checkbox!, {target: {checked: false}});
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 10, filters: {enabled: {operator: 'equals', value: false}}});
  });

  it('renders both date range boundaries and preserves a partial range', () => {
    const onQueryChange = vi.fn();
    const {container} = render(
      <TableFilters
        query={{page: 2, pageSize: 10}}
        filters={[{key: 'createdAt', label: 'Created', type: 'date-range', operators: ['between']}]}
        onQueryChange={onQueryChange}
        searchDebounceMs={0}
      />,
    );

    const fields = container.querySelectorAll('s-text-field');
    expect(fields).toHaveLength(2);
    fireEvent.input(fields[0]!, {target: {value: '2026-01-01'}});
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      filters: {createdAt: {operator: 'between', value: {from: '2026-01-01'}}},
    });
    expect(fields[1]).toBeInTheDocument();
  });

  it('debounces trimmed search and cancels stale input updates', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    const {container, rerender} = render(<TableFilters query={{page: 2, pageSize: 10}} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    const search = container.querySelector('s-search-field')!;
    fireEvent.input(search, {target: {value: ' first '}});
    fireEvent.input(search, {target: {value: 'second'}});
    act(() => vi.advanceTimersByTime(99));
    expect(onQueryChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 10, search: 'second'});
    rerender(<TableFilters query={{page: 1, pageSize: 10, search: 'external'}} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    expect((container.querySelector('s-search-field') as HTMLElement & {value: string}).value).toBe('external');
    vi.useRealTimers();
  });

  it('removes applied chips and clears all query criteria', () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = {page: 3, pageSize: 10, search: 'shoe', filters: {status: {operator: 'equals', value: 'active'}}};
    const {container} = render(<TableFilters query={query} filters={[{key: 'status', label: 'Status', type: 'select', operators: ['equals'], options: [{label: 'Active', value: 'active'}]}]} onQueryChange={onQueryChange} searchDebounceMs={0} />);
    const chip = container.querySelector('s-clickable-chip')!;
    fireEvent(chip, new Event('remove'));
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 10, search: 'shoe'});
    const clear = Array.from(container.querySelectorAll('s-button')).find((button) => button.textContent === 'Clear all');
    expect(clear).toBeDefined();
    fireEvent.click(clear!);
    expect(onQueryChange).toHaveBeenLastCalledWith({page: 1, pageSize: 10});
  });

  it('cancels a pending search on router/page restore even when search is unchanged', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    const {container, rerender, unmount} = render(<TableFilters query={{page: 1, pageSize: 10}} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: 'pending'}});
    rerender(<TableFilters query={{page: 3, pageSize: 10}} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    expect(container.querySelector('s-search-field')).toHaveProperty('value', '');
    act(() => vi.advanceTimersByTime(100));
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: 'unmounted'}});
    unmount();
    act(() => vi.advanceTimersByTime(100));
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('never revives a cancelled draft after A to B to A navigation or loading', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    const a: TableQuery = {page: 1, pageSize: 10};
    const b: TableQuery = {page: 2, pageSize: 10};
    const {container, rerender} = render(<TableFilters query={a} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: 'cancelled'}});
    rerender(<TableFilters query={b} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    rerender(<TableFilters query={a} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    act(() => vi.advanceTimersByTime(200));
    expect(container.querySelector('s-search-field')).toHaveProperty('value', '');
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: 'loading-cancelled'}});
    rerender(<TableFilters query={a} loading onQueryChange={onQueryChange} searchDebounceMs={100} />);
    rerender(<TableFilters query={a} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    act(() => vi.advanceTimersByTime(200));
    expect(onQueryChange).not.toHaveBeenCalled();
  });

  it('uses the latest callback without restarting the search deadline', () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const latest = vi.fn();
    const query: TableQuery = {page: 2, pageSize: 10};
    const {container, rerender} = render(<TableFilters query={query} onQueryChange={first} searchDebounceMs={100} />);
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: '  trimmed  '}});
    act(() => vi.advanceTimersByTime(80));
    rerender(<TableFilters query={{...query}} onQueryChange={latest} searchDebounceMs={100} />);
    act(() => vi.advanceTimersByTime(20));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledOnce();
    expect(latest).toHaveBeenCalledWith({page: 1, pageSize: 10, search: 'trimmed'});
  });

  it('commits a pending search together with an immediate filter and cancels its timer', () => {
    vi.useFakeTimers();
    const onQueryChange = vi.fn();
    const {container} = render(<TableFilters query={{page: 4, pageSize: 10}} filters={[{key: 'status', label: 'Status', type: 'select', operators: ['equals'], options: [{label: 'Active', value: 'active'}]}]} onQueryChange={onQueryChange} searchDebounceMs={100} />);
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: 'shoe'}});
    fireEvent.change(container.querySelector('s-select')!, {target: {value: 'active'}});
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 10, search: 'shoe', filters: {status: {operator: 'equals', value: 'active'}}});
    act(() => vi.advanceTimersByTime(200));
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it('preserves a permitted current operator and rejects undeclared option values', () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = {page: 3, pageSize: 10, filters: {status: {operator: 'notEquals', value: 'active'}}};
    const {container} = render(<TableFilters query={query} filters={[{key: 'status', label: 'Status', type: 'select', operators: ['equals', 'notEquals'], options: [{label: 'Active', value: 'active'}, {label: 'Draft', value: 'draft'}]}]} onQueryChange={onQueryChange} />);
    fireEvent.change(container.querySelector('s-select')!, {target: {value: 'unsafe'}});
    expect(onQueryChange).not.toHaveBeenCalled();
    fireEvent.change(container.querySelector('s-select')!, {target: {value: 'draft'}});
    expect(onQueryChange).toHaveBeenLastCalledWith({page: 1, pageSize: 10, filters: {status: {operator: 'notEquals', value: 'draft'}}});
    fireEvent.change(container.querySelector('s-select')!, {target: {value: ''}});
    expect(onQueryChange).toHaveBeenLastCalledWith({page: 1, pageSize: 10});
  });

  it('writes deduplicated multi-select values and preserves partial ranges including zero', () => {
    const onQueryChange = vi.fn();
    const definitions: readonly TableFilterDefinition[] = [{key: 'tags', label: 'Tags', type: 'multi-select', operators: ['in'], options: [{label: 'A', value: 'a'}]}, {key: 'date', label: 'Date', type: 'date-range', operators: ['between']}];
    const query: TableQuery = {page: 2, pageSize: 10, filters: {date: {operator: 'between', value: {from: 0, to: '2026-01-01'}}}};
    const {container} = render(<TableFilters query={query} filters={definitions} onQueryChange={onQueryChange} />);
    fireEvent.change(container.querySelector('s-choice-list')!, {target: {values: ['a', 'a']}});
    expect(onQueryChange).toHaveBeenLastCalledWith({...query, page: 1, filters: {...query.filters, tags: {operator: 'in', value: ['a']}}});
    fireEvent.input(container.querySelectorAll('s-text-field')[1]!, {target: {value: ''}});
    expect(onQueryChange).toHaveBeenLastCalledWith({page: 1, pageSize: 10, filters: {date: {operator: 'between', value: {from: 0}}}});
  });

  it('rejects query changes while loading and keeps externally controlled chips visible', () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = {page: 2, pageSize: 10, filters: {enabled: {operator: 'equals', value: false}}};
    const {container} = render(<TableFilters query={query} filters={[{key: 'enabled', label: 'Enabled', type: 'boolean', operators: ['equals']}]} onQueryChange={onQueryChange} loading />);
    fireEvent.input(container.querySelector('s-search-field')!, {target: {value: 'blocked'}});
    fireEvent.change(container.querySelector('s-checkbox')!, {target: {checked: true}});
    fireEvent(container.querySelector('s-clickable-chip')!, new Event('remove'));
    expect(onQueryChange).not.toHaveBeenCalled();
    expect(container.querySelector('s-clickable-chip')).toHaveTextContent('false');
  });

  it('uses only an operator declared by the filter definition', () => {
    const onQueryChange = vi.fn();
    const {container} = render(
      <TableFilters
        query={{page: 1, pageSize: 10}}
        filters={[{key: 'status', label: 'Status', type: 'select', operators: ['notEquals'], options: [{label: 'Active', value: 'active'}]}]}
        onQueryChange={onQueryChange}
        searchDebounceMs={0}
      />,
    );

    const select = container.querySelector('s-select');
    expect(select).not.toBeNull();
    fireEvent.change(select!, {target: {value: 'active'}});
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      filters: {status: {operator: 'notEquals', value: 'active'}},
    });
  });
});
