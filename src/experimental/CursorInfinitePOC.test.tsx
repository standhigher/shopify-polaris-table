import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {render} from '../test/setup';
import {CursorInfinitePOC} from './CursorInfinitePOC';

type Row = {id: string; label: string};

const firstRows: Row[] = [{id: 'a', label: 'Alpha'}, {id: 'b', label: 'Bravo'}];

function renderPOC(loadPage: ReturnType<typeof vi.fn>, initialNextCursor: string | null = 'cursor-1') {
  return render(<CursorInfinitePOC
    initialItems={firstRows}
    initialNextCursor={initialNextCursor}
    pageSize={25}
    search="ada"
    getItemId={(row) => row.id}
    renderItem={(row) => row.label}
    loadPage={loadPage}
    ariaLabel="Experimental cursor rows"
  />);
}

describe('CursorInfinitePOC', () => {
  it('loads a V3 cursor page, deduplicates rows, and reports the terminal state', async () => {
    const loadPage = vi.fn().mockResolvedValue({data: [{id: 'b', label: 'Duplicate'}, {id: 'c', label: 'Charlie'}], nextCursor: null});
    renderPOC(loadPage);

    expect(screen.getByTestId('cursor-poc')).toHaveAttribute('data-query-mode', 'cursor');
    fireEvent.click(screen.getByRole('button', {name: 'Load more rows'}));

    expect(await screen.findByText('Charlie')).toBeInTheDocument();
    expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('All rows loaded');
    expect(screen.queryByRole('button', {name: 'Load more rows'})).not.toBeInTheDocument();
    expect(loadPage).toHaveBeenCalledWith({cursor: 'cursor-1', query: {mode: 'cursor', pageSize: 25, search: 'ada'}});
    expect(loadPage.mock.calls[0]?.[0].query).not.toHaveProperty('page');
  });

  it('announces loading and retries the same cursor after a failed request', async () => {
    const loadPage = vi.fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({data: [{id: 'c', label: 'Charlie'}], nextCursor: null});
    renderPOC(loadPage);

    fireEvent.click(screen.getByRole('button', {name: 'Load more rows'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.getByRole('button', {name: 'Load more rows'})).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Retry loading rows'}));
    expect(await screen.findByText('Charlie')).toBeInTheDocument();
    expect(loadPage).toHaveBeenNthCalledWith(1, {cursor: 'cursor-1', query: {mode: 'cursor', pageSize: 25, search: 'ada'}});
    expect(loadPage).toHaveBeenNthCalledWith(2, {cursor: 'cursor-1', query: {mode: 'cursor', pageSize: 25, search: 'ada'}});
  });

  it('does not offer loading controls when the initial cursor is exhausted', () => {
    const loadPage = vi.fn();
    renderPOC(loadPage, null);

    expect(screen.getByRole('status')).toHaveTextContent('All rows loaded');
    expect(screen.queryByRole('button', {name: /load more/i})).not.toBeInTheDocument();
    expect(loadPage).not.toHaveBeenCalled();
  });
});
