import {describe, expect, it} from 'vitest';
import {appendCursorPage, canLoadMoreCursorPage, createCursorQuery, isCursorQuery} from './infinite';

describe('cursor infinite loading contract', () => {
  it('uses a cursor query distinct from the offset query', () => {
    const query = createCursorQuery({pageSize: 25, search: 'ada'});
    expect(query).toEqual({mode: 'cursor', pageSize: 25, search: 'ada'});
    expect(isCursorQuery(query)).toBe(true);
    expect(isCursorQuery({page: 1, pageSize: 25})).toBe(false);
  });

  it('deduplicates appended rows and guards concurrent/end loads', () => {
    const initial = {items: [{id: 'a'}, {id: 'b'}], nextCursor: 'next', loading: false};
    const appended = appendCursorPage(initial, {data: [{id: 'b'}, {id: 'c'}], nextCursor: null}, (row) => row.id);
    expect(appended).toEqual({items: [{id: 'a'}, {id: 'b'}, {id: 'c'}], nextCursor: null, loading: false});
    expect(canLoadMoreCursorPage(initial)).toBe(true);
    expect(canLoadMoreCursorPage({...initial, loading: true})).toBe(false);
    expect(canLoadMoreCursorPage({...initial, nextCursor: null})).toBe(false);
  });
});
