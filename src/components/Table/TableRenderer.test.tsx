import {useState} from 'react';
import {fireEvent, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {render} from '../../test/setup';
import {Table} from './Table';
import type {TableColumn, TableProps} from '../../types';

type Row = {id: string; text: string; number: number; money: number; status: string; date: string; image: string; actions?: string; custom?: string};
const row: Row = {id: 'a', text: 'Inventory', number: 1234, money: 12.5, status: 'Active', date: '2026-01-01T00:00:00.000Z', image: 'https://example.test/image.png'};
const props: Omit<TableProps<Row>, 'columns'> = {
  data: [row], rowId: 'id', query: {page: 1, pageSize: 25}, pagination: {total: 1},
  selection: {mode: 'explicit', ids: []}, formatOptions: {locale: 'en-US', timeZone: 'UTC', defaultCurrencyCode: 'USD'},
  onQueryChange: vi.fn(), onSelectionChange: vi.fn(),
};

function StatefulCell({name}: {name: string}) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((current) => current + 1)}>{`${name}:${count}`}</button>;
}

describe('Polaris table column renderer', () => {
  it('maps every column type, format, list slot and rich custom content', () => {
    const columns: readonly TableColumn<Row>[] = [
      {key: 'text', title: <strong>Title</strong>, type: 'text', listSlot: 'primary'},
      {key: 'number', title: 'Quantity', type: 'number', listSlot: 'secondary', align: 'center'},
      {key: 'money', title: 'Price', type: 'money', listSlot: 'labeled', align: 'end'},
      {key: 'status', title: 'Status', type: 'status', listSlot: 'inline', statusTone: {Active: 'success'}},
      {key: 'date', title: 'Date', type: 'datetime', listSlot: 'kicker'},
      {key: 'image', title: 'Image', type: 'image', imageAlt: 'Inventory image'},
      {key: 'actions', title: 'Actions', type: 'actions', render: () => <s-link href="https://example.test/item">Open</s-link>},
      {key: 'custom', title: 'Custom', type: 'custom', render: () => <s-badge>Custom content</s-badge>},
    ];
    const {container} = render(<Table {...props} columns={columns} />);
    const headers = container.querySelectorAll('s-table-header');
    expect(headers).toHaveLength(9);
    expect(headers[1]).toHaveAttribute('listslot', 'primary');
    expect(headers[2]).toHaveAttribute('format', 'numeric');
    expect(headers[2]?.firstElementChild).toHaveStyle({textAlign: 'center'});
    expect(headers[3]).toHaveAttribute('format', 'currency');
    expect(headers[4]).toHaveAttribute('listslot', 'inline');
    expect(headers[5]).toHaveAttribute('listslot', 'kicker');
    expect(headers[6]).toHaveAttribute('listslot', 'labeled');
    expect(headers[1]?.querySelector('strong')).toHaveTextContent('Title');
    const cells = container.querySelectorAll('s-table-row s-table-cell');
    expect(cells).toHaveLength(9);
    expect(cells[2]).toHaveTextContent('1,234');
    expect(cells[3]).toHaveTextContent('$12.50');
    expect(cells[4]?.querySelector('s-badge')).toHaveAttribute('tone', 'success');
    expect(cells[6]?.querySelector('s-thumbnail')).toHaveAttribute('alt', 'Inventory image');
    expect(cells[7]?.querySelector('s-link')).toHaveTextContent('Open');
    expect(cells[8]?.querySelector('s-badge')).toHaveTextContent('Custom content');
    expect(container.querySelector('s-table')).toHaveAttribute('variant', 'auto');
  });

  it('preserves stateful custom cell identity when columns are reordered or removed', () => {
    const first: TableColumn<Row> = {key: 'first', title: 'First', type: 'custom', render: () => <StatefulCell name="first" />};
    const second: TableColumn<Row> = {key: 'second', title: 'Second', type: 'custom', render: () => <StatefulCell name="second" />};
    const {container, rerender} = render(<Table {...props} columns={[first, second]} />);
    fireEvent.click(screen.getByRole('button', {name: 'second:0'}));
    rerender(<Table {...props} columns={[second, first]} />);
    expect(screen.getByRole('button', {name: 'second:1'})).toBeInTheDocument();
    expect(container.querySelectorAll('s-table-row s-table-cell')[1]).toHaveTextContent('second:1');
    rerender(<Table {...props} columns={[second]} />);
    expect(screen.getByRole('button', {name: 'second:1'})).toBeInTheDocument();
    expect(container.querySelectorAll('s-table-header')).toHaveLength(2);
    expect(container.querySelectorAll('s-table-row s-table-cell')).toHaveLength(2);
  });

  it('binds row actions to a declared actions column without adding a duplicate column', async () => {
    const perform = vi.fn();
    const columns: readonly TableColumn<Row>[] = [{key: 'text', title: 'Title'}, {key: 'actions', title: 'Operations', type: 'actions'}];
    const {container} = render(<Table {...props} columns={columns} rowActions={[{id: 'open', content: 'Open item', perform}]} />);
    expect(container.querySelectorAll('s-table-header')).toHaveLength(3);
    expect(container.querySelectorAll('s-table-row s-table-cell')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', {name: 'Open item'}));
    await vi.waitFor(() => expect(perform).toHaveBeenCalledWith({row, rowId: 'a'}));
    expect(props.onSelectionChange).not.toHaveBeenCalled();
  });

  it('rejects duplicate column keys and row IDs', () => {
    const duplicateColumns: readonly TableColumn<Row>[] = [{key: 'text', title: 'One'}, {key: 'text', title: 'Two'}];
    expect(() => render(<Table {...props} columns={duplicateColumns} />)).toThrow('unique keys');
    const duplicateRows = [{...row}, {...row}];
    expect(() => render(<Table {...props} columns={[{key: 'text', title: 'Text'}]} data={duplicateRows} />)).toThrow('unique IDs');
  });

  it('combines custom actions content and row actions without a second actions column', () => {
    const columns: readonly TableColumn<Row>[] = [{key: 'text', title: 'Title'}, {key: 'actions', title: 'Operations', type: 'actions', render: () => <s-link href="https://example.test/details">Details</s-link>}];
    const {container} = render(<Table {...props} columns={columns} rowActions={[{id: 'open', content: 'Open', perform: vi.fn()}]} />);
    const actionCell = container.querySelectorAll('s-table-row s-table-cell')[2];
    expect(container.querySelectorAll('s-table-header')).toHaveLength(3);
    expect(actionCell?.querySelector('s-link')).toHaveTextContent('Details');
    expect(actionCell?.querySelector('s-button')).toHaveTextContent('Open');
  });

  it('keeps duplicate singleton list slots visible as labeled fields', () => {
    const columns: readonly TableColumn<Row>[] = [
      {key: 'text', title: 'Title', listSlot: 'primary'},
      {key: 'number', title: 'Quantity', listSlot: 'secondary'},
      {key: 'date', title: 'Date', listSlot: 'secondary'},
      {key: 'image', title: 'Image', listSlot: 'kicker'},
      {key: 'custom', title: 'Other', listSlot: 'kicker'},
    ];
    const {container} = render(<Table {...props} columns={columns} />);
    expect(Array.from(container.querySelectorAll('s-table-header')).map((header) => header.getAttribute('listslot'))).toEqual(['inline', 'primary', 'secondary', 'labeled', 'kicker', 'labeled']);
  });

  it('keeps declared ordering while filtering visible column preferences', () => {
    const columns: readonly TableColumn<Row>[] = [{key: 'text', title: 'Title'}, {key: 'number', title: 'Quantity'}, {key: 'money', title: 'Price'}];
    const {container, rerender} = render(<Table {...props} columns={columns} visibleColumnKeys={['money', 'text']} />);
    expect(Array.from(container.querySelectorAll('s-table-header')).slice(1).map((header) => header.textContent)).toEqual(['Title', 'Price']);
    rerender(<Table {...props} columns={[columns[1]!, columns[0]!]} visibleColumnKeys={['number', 'text']} />);
    expect(Array.from(container.querySelectorAll('s-table-header')).slice(1).map((header) => header.textContent)).toEqual(['Quantity', 'Title']);
  });
});
