import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {render} from '../test/setup';
import {VirtualListPOC} from './VirtualListPOC';

const items = Array.from({length: 10_000}, (_, index) => ({id: String(index), label: `Row ${index}`}));

describe('VirtualListPOC', () => {
  it('keeps a bounded fixed-height window while scrolling a large list', () => {
    render(<VirtualListPOC
      items={items}
      itemKey={(item) => item.id}
      renderItem={(item) => item.label}
      itemSize={20}
      viewportSize={100}
      overscan={1}
      ariaLabel="Virtual rows"
    />);

    const list = screen.getByRole('list', {name: 'Virtual rows'});
    expect(list).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('Row 0')).toBeInTheDocument();

    Object.defineProperty(list, 'scrollTop', {configurable: true, value: 200});
    fireEvent.scroll(list);

    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.queryByText('Row 0')).not.toBeInTheDocument();
    expect(screen.getByText('Row 9')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 7 of 10000 rows');
  });

  it('renders an accessible empty list without phantom rows', () => {
    render(<VirtualListPOC
      items={[]}
      itemKey={(item) => item}
      renderItem={(item) => item}
      itemSize={20}
      viewportSize={100}
      ariaLabel="Empty virtual rows"
    />);

    expect(screen.getByRole('list', {name: 'Empty virtual rows'})).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Showing 0 of 0 rows');
  });
});
