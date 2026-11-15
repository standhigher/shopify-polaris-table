import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {TableQuery} from '../src';
import {UrlStateExample} from './url-state';

vi.mock('../src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src')>();
  return {
    ...actual,
    Table: ({query, onQueryChange}: {query: TableQuery; onQueryChange: (query: TableQuery) => void}) => <>
      <output data-testid="query">{JSON.stringify(query)}</output>
      <button onClick={() => onQueryChange({...query, page: query.page + 1})}>Next query</button>
      <button onClick={() => {
        const next: TableQuery = {...query, page: 1};
        delete next.search;
        delete next.sort;
        delete next.filters;
        onQueryChange(next);
      }}>Clear query</button>
    </>,
  };
});

const page = {data: [{id: '1', title: 'Product', status: 'active'}], total: 1};
const renderedQuery = (): TableQuery => JSON.parse(screen.getByTestId('query').textContent ?? '{}') as TableQuery;

beforeEach(() => window.history.replaceState(null, '', '/products'));
afterEach(() => vi.restoreAllMocks());

describe('History API URL-state example', () => {
  it('restores a refresh URL after mount without writing history', () => {
    window.history.replaceState({host: 'preserved'}, '', '/products?campaign=summer&v=1&page=3&pageSize=50&sort=asc:title#inventory');
    const push = vi.spyOn(window.history, 'pushState');
    render(<UrlStateExample page={page} />);
    expect(renderedQuery()).toEqual({page: 3, pageSize: 50, sort: {field: 'title', direction: 'asc'}});
    expect(push).not.toHaveBeenCalled();
  });

  it('preserves unrelated params, duplicate unrelated params, hash, and history state', () => {
    const filters = encodeURIComponent(JSON.stringify({status: {operator: 'equals', value: 'active'}}));
    window.history.replaceState({host: 'preserved'}, '', `/products?campaign=summer&tag=a&tag=b&v=1&page=3&pageSize=50&search=shoe&sort=asc:title&filters=${filters}#inventory`);
    render(<UrlStateExample page={page} />);
    fireEvent.click(screen.getByRole('button', {name: 'Clear query'}));
    const params = new URLSearchParams(window.location.search);
    expect(params.get('campaign')).toBe('summer');
    expect(params.getAll('tag')).toEqual(['a', 'b']);
    expect(params.get('v')).toBe('1');
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('50');
    expect(params.has('search')).toBe(false);
    expect(params.has('sort')).toBe(false);
    expect(params.has('filters')).toBe(false);
    expect(window.location.hash).toBe('#inventory');
    expect(window.history.state).toEqual({host: 'preserved'});
    expect(renderedQuery()).toEqual({page: 1, pageSize: 50});
  });

  it('restores actual browser back and forward entries without pushing a replacement entry', async () => {
    window.history.replaceState({host: 'one'}, '', '/products?host=retained&v=1&page=2&pageSize=25');
    render(<UrlStateExample page={page} />);
    fireEvent.click(screen.getByRole('button', {name: 'Next query'}));
    expect(renderedQuery().page).toBe(3);
    const push = vi.spyOn(window.history, 'pushState');
    act(() => window.history.back());
    await waitFor(() => expect(renderedQuery().page).toBe(2));
    act(() => window.history.forward());
    await waitFor(() => expect(renderedQuery().page).toBe(3));
    expect(push).not.toHaveBeenCalled();
    expect(new URLSearchParams(window.location.search).get('host')).toBe('retained');
  });

  it('removes the popstate listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const {unmount} = render(<UrlStateExample page={page} />);
    unmount();
    expect(remove).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('renders deterministically on the server without a window', () => {
    vi.stubGlobal('window', undefined);
    try {
      const html = renderToString(<UrlStateExample page={page} />);
      expect(html).toContain('&quot;page&quot;:1');
      expect(html).toContain('&quot;pageSize&quot;:25');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
