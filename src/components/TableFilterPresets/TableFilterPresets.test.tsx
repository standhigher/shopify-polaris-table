import {fireEvent} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../../test/setup';
import {TableFilterPresets} from './TableFilterPresets';

describe('TableFilterPresets', () => {
  it('applies only the preset filters and resets the page', () => {
    const onQueryChange = vi.fn();
    const {container} = render(<TableFilterPresets
      presets={[{id: 'active', label: 'Active', filters: {status: {operator: 'equals', value: 'active'}}}]}
      query={{page: 3, pageSize: 50, search: 'shoe', sort: {field: 'name', direction: 'asc'}}}
      onQueryChange={onQueryChange}
    />);

    const button = container.querySelector('s-button');
    expect(button).not.toBeNull();
    expect(button).toHaveTextContent('Active');
    fireEvent.click(button!);
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      search: 'shoe',
      sort: {field: 'name', direction: 'asc'},
      filters: {status: {operator: 'equals', value: 'active'}},
    });
  });
});
