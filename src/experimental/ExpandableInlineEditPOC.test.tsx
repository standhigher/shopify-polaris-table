import {fireEvent, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../test/setup';
import {ExpandableInlineEditPOC} from './ExpandableInlineEditPOC';

const row = {id: 'row-1', name: 'Ada', details: 'Customer details', version: 'v1'};

function renderPOC(overrides: Partial<React.ComponentProps<typeof ExpandableInlineEditPOC>> = {}) {
  const onExpandedIdsChange = vi.fn();
  const onSave = vi.fn(async () => ({status: 'saved' as const, version: 'v2'}));
  const rendered = render(<ExpandableInlineEditPOC
    rows={[row]}
    expandedIds={[]}
    onExpandedIdsChange={onExpandedIdsChange}
    onSave={onSave}
    ariaLabel="Expandable edit POC"
    {...overrides}
  />);
  return {...rendered, onExpandedIdsChange, onSave};
}

describe('ExpandableInlineEditPOC', () => {
  it('keeps expansion controlled and moves focus to newly revealed details', () => {
    const {onExpandedIdsChange, rerender} = renderPOC();

    fireEvent.click(screen.getByRole('button', {name: 'Expand details'}));
    expect(onExpandedIdsChange).toHaveBeenCalledWith(['row-1']);
    expect(screen.queryByRole('region', {name: 'Ada details'})).not.toBeInTheDocument();

    rerender(<ExpandableInlineEditPOC
      rows={[row]}
      expandedIds={['row-1']}
      onExpandedIdsChange={onExpandedIdsChange}
      onSave={vi.fn()}
      ariaLabel="Expandable edit POC"
    />);
    expect(screen.getByRole('button', {name: 'Collapse details'})).toHaveAttribute('aria-controls', 'row-1-details');
    expect(screen.getByRole('region', {name: 'Ada details'})).toHaveFocus();
  });

  it('validates locally and rolls back the draft on cancel without writing the controlled row', () => {
    const {onSave} = renderPOC();

    fireEvent.click(screen.getByRole('button', {name: 'Edit name'}));
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, {target: {value: ''}});
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(input, {target: {value: 'Grace'}});
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(screen.queryByRole('group', {name: 'Edit Ada'})).not.toBeInTheDocument();
    expect(screen.getByRole('cell')).toHaveTextContent('Ada');

    fireEvent.click(screen.getByRole('button', {name: 'Edit name'}));
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  });

  it('sends versioned drafts through the host boundary and waits for controlled data to change', async () => {
    const {onSave} = renderPOC();

    fireEvent.click(screen.getByRole('button', {name: 'Edit name'}));
    fireEvent.change(screen.getByLabelText('Name'), {target: {value: 'Grace'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({rowId: 'row-1', draft: {name: 'Grace'}, version: 'v1'}));
    expect(screen.getByRole('cell')).toHaveTextContent('Ada');
    expect(screen.getByRole('status')).toHaveTextContent('Awaiting the host');
  });

  it('surfaces version conflicts without silently applying a stale draft', async () => {
    const onSave = vi.fn(async () => ({status: 'conflict' as const, version: 'v2'}));
    renderPOC({onSave});

    fireEvent.click(screen.getByRole('button', {name: 'Edit name'}));
    fireEvent.change(screen.getByLabelText('Name'), {target: {value: 'Grace'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert')).toHaveTextContent('changed elsewhere');
    expect(screen.getByLabelText('Name')).toHaveValue('Grace');
    expect(screen.getByRole('cell')).toHaveTextContent('Ada');
  });
});
