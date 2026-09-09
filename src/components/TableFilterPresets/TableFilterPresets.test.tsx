import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../../test/setup';
import {TableFilterPresets} from './TableFilterPresets';

describe('TableFilterPresets', () => {
  it('applies only the preset filters and resets the page', () => {
    const onQueryChange = vi.fn();
    render(<TableFilterPresets
      presets={[{id: 'active', label: 'Active', filters: {status: {operator: 'equals', value: 'active'}}}]}
      query={{page: 3, pageSize: 50, search: 'shoe', sort: {field: 'name', direction: 'asc'}}}
      onQueryChange={onQueryChange}
    />);

    fireEvent.click(screen.getByRole('button', {name: 'Active'}));
    expect(onQueryChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50,
      search: 'shoe',
      sort: {field: 'name', direction: 'asc'},
      filters: {status: {operator: 'equals', value: 'active'}},
    });
  });
});
