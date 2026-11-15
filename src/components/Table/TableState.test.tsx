import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {render} from '../../test/setup';
import {TableState} from './TableState';

describe('TableState', () => {
  it('renders an empty state only when empty and not loading', () => {
    const {rerender, container} = render(<TableState empty />);
    expect(container.querySelector('s-empty-state')).toBeInTheDocument();
    rerender(<TableState empty loading />);
    expect(container.querySelector('s-empty-state')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders custom empty content and critical retry in the banner action slot', () => {
    const retry = vi.fn();
    const {container} = render(<TableState error="Request failed" empty onRetry={retry} emptyState={<s-text>Nothing found</s-text>} />);
    expect(container.querySelector('s-empty-state')).toBeNull();
    const button = container.querySelector('s-banner s-button[slot="secondary-actions"]')!;
    fireEvent.click(button);
    expect(retry).toHaveBeenCalledOnce();
  });

  it('does not replace old data with a spinner during background refresh', () => {
    const {container} = render(<TableState loading hasData />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});
