import {fireEvent} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {render} from '../../test/setup';
import type {TableQuery} from '../../types';
import {TableFilterPresets} from './TableFilterPresets';

describe('TableFilterPresets', () => {
  it('applies only the preset filters and resets the page', () => {
    const onQueryChange = vi.fn();
    const {container} = render(<TableFilterPresets
      presets={[{id: 'active', label: 'Active', filters: {status: {operator: 'equals', value: 'active'}}}]}
      query={{page: 3, pageSize: 50, search: 'shoe', sort: {field: 'name', direction: 'asc'}}}
      onQueryChange={onQueryChange}
    />);
    const button = container.querySelector('s-button')!;
    expect(button).toHaveTextContent('Active');
    expect(button).toHaveAttribute('slot', 'secondary-actions');
    expect(button).toHaveAttribute('variant', 'secondary');
    fireEvent.click(button);
    expect(onQueryChange).toHaveBeenCalledWith({page: 1, pageSize: 50, search: 'shoe', sort: {field: 'name', direction: 'asc'}, filters: {status: {operator: 'equals', value: 'active'}}});
  });

  it('renders no controls for an empty preset list', () => {
    const {container} = render(<TableFilterPresets presets={[]} query={{page: 1, pageSize: 25}} onQueryChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('preserves the latest controlled search/sort/page size and does not mutate inputs', () => {
    const onQueryChange = vi.fn();
    const query: TableQuery = {page: 4, pageSize: 50, search: 'old', sort: {field: 'name', direction: 'asc'}, filters: {quantity: {operator: 'equals', value: 0}}};
    const preset = {id: 'clear', label: 'Clear filters', filters: {}};
    const before = JSON.stringify(query);
    const {container, rerender} = render(<TableFilterPresets presets={[preset]} query={query} onQueryChange={onQueryChange} />);
    fireEvent.click(container.querySelector('s-button')!);
    expect(onQueryChange).toHaveBeenLastCalledWith({...query, page: 1, filters: {}});
    expect(JSON.stringify(query)).toBe(before);
    expect(preset.filters).toEqual({});
    const restored: TableQuery = {page: 7, pageSize: 10, search: 'restored', sort: {field: 'createdAt', direction: 'desc'}, filters: {archived: {operator: 'equals', value: false}}};
    rerender(<TableFilterPresets presets={[preset]} query={restored} onQueryChange={onQueryChange} />);
    fireEvent.click(container.querySelector('s-button')!);
    expect(onQueryChange).toHaveBeenLastCalledWith({...restored, page: 1, filters: {}});
    expect(restored.filters).toEqual({archived: {operator: 'equals', value: false}});
  });
});
