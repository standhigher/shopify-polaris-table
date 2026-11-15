import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import type {TableColumn, TableFormatOptions} from '../types';
import {EMPTY_CELL_PLACEHOLDER} from '../utils/formatters';
import {renderCell} from './renderCell';

describe('renderCell', () => {
  const formatOptions: TableFormatOptions = {
    locale: 'en-US',
    timeZone: 'Asia/Shanghai',
    defaultCurrencyCode: 'USD',
  };

  it('renders text values, preserves zero and false, and uses placeholder for empty values', () => {
    const column: TableColumn<{value: unknown}> = {key: 'value', title: 'Value', type: 'text'};
    const {container, rerender} = render(<>{renderCell(column, {value: 'Alice'}, formatOptions)}</>);
    expect(screen.getByText('Alice')).toBeInTheDocument();

    rerender(<>{renderCell(column, {value: 0}, formatOptions)}</>);
    expect(container).toHaveTextContent('0');
    rerender(<>{renderCell(column, {value: false}, formatOptions)}</>);
    expect(container).toHaveTextContent('false');
    rerender(<>{renderCell(column, {value: null}, formatOptions)}</>);
    expect(container).toHaveTextContent(EMPTY_CELL_PLACEHOLDER);
  });

  it('renders number formatting and an empty placeholder for invalid numbers', () => {
    const column: TableColumn<{amount: unknown}> = {key: 'amount', title: 'Amount', type: 'number'};
    const {container, rerender} = render(<>{renderCell(column, {amount: 1234.5}, formatOptions)}</>);
    expect(container).toHaveTextContent('1,234.5');
    rerender(<>{renderCell(column, {amount: 'not-a-number'}, formatOptions)}</>);
    expect(container).toHaveTextContent(EMPTY_CELL_PLACEHOLDER);
  });

  it('uses row currency before column and default currency for money', () => {
    const column: TableColumn<{amount: number; currency: string}> = {
      key: 'amount', title: 'Amount', type: 'money', currencyCode: (row) => row.currency,
    };
    const {container} = render(<>{renderCell(column, {amount: 12.5, currency: 'EUR'}, formatOptions)}</>);
    expect(container).toHaveTextContent('€12.50');

    const columnCurrency: TableColumn<{amount: number}> = {key: 'amount', title: 'Amount', type: 'money', currencyCode: 'CAD'};
    const {container: columnContainer} = render(<>{renderCell(columnCurrency, {amount: 12.5}, formatOptions)}</>);
    expect(columnContainer).toHaveTextContent('CA$12.50');
  });

  it('reports a missing money currency and keeps the locale number', () => {
    const onFormatWarning = vi.fn();
    const column: TableColumn<{amount: number}> = {key: 'amount', title: 'Amount', type: 'money'};
    const {container} = render(<>{renderCell(column, {amount: 12.5}, {locale: formatOptions.locale, timeZone: formatOptions.timeZone})}</>);
    expect(container).toHaveTextContent('12.5');
    render(<>{renderCell(column, {amount: 12.5}, {locale: formatOptions.locale, timeZone: formatOptions.timeZone}, onFormatWarning)}</>);
    expect(onFormatWarning).toHaveBeenCalledWith({columnKey: 'amount', reason: 'missing-currency-code'});
  });

  it('formats datetime with the column timezone and uses placeholder for invalid dates', () => {
    const column: TableColumn<{createdAt: string}> = {key: 'createdAt', title: 'Created', type: 'datetime', timeZone: 'Asia/Shanghai'};
    const {container, rerender} = render(<>{renderCell(column, {createdAt: '2026-08-13T00:30:00.000Z'}, formatOptions)}</>);
    expect(container).toHaveTextContent('Aug 13, 2026, 8:30 AM');
    rerender(<>{renderCell(column, {createdAt: 'not-a-date'}, formatOptions)}</>);
    expect(container).toHaveTextContent(EMPTY_CELL_PLACEHOLDER);
  });

  it('renders status as a Polaris badge and uses neutral for unknown values', () => {
    const column: TableColumn<{status: string}> = {key: 'status', title: 'Status', type: 'status', statusTone: {active: 'success'}};
    const {container, rerender} = render(<>{renderCell(column, {status: 'active'}, formatOptions)}</>);
    expect(container.querySelector('s-badge')).toHaveAttribute('tone', 'success');
    expect(container).toHaveTextContent('active');
    rerender(<>{renderCell(column, {status: 'mystery'}, formatOptions)}</>);
    expect(container.querySelector('s-badge')).toHaveAttribute('tone', 'neutral');
  });

  it('renders valid images as thumbnails with configured accessible alt text', () => {
    const column: TableColumn<{image: string; title: string}> = {
      key: 'image', title: 'Image', type: 'image', imageAlt: (row) => row.title,
    };
    const {container} = render(<>{renderCell(column, {image: 'https://cdn.example.com/item.png', title: 'Item image'}, formatOptions)}</>);
    const thumbnail = container.querySelector('s-thumbnail');
    expect(thumbnail).toHaveAttribute('src', 'https://cdn.example.com/item.png');
    expect(thumbnail).toHaveAttribute('alt', 'Item image');
    expect(thumbnail).toHaveAttribute('size', 'small');
  });

  it('uses placeholder for missing or invalid image URLs and does not remove managed nodes', () => {
    const column: TableColumn<{image: string | null}> = {key: 'image', title: 'Image', type: 'image'};
    const {container, rerender} = render(<>{renderCell(column, {image: null}, formatOptions)}</>);
    expect(container.querySelector('s-thumbnail')).toBeNull();
    expect(container).toHaveTextContent(EMPTY_CELL_PLACEHOLDER);
    rerender(<>{renderCell(column, {image: 'javascript:alert(1)'}, formatOptions)}</>);
    expect(container.querySelector('s-thumbnail')).toBeNull();
    expect(container).toHaveTextContent(EMPTY_CELL_PLACEHOLDER);
  });

  it('prioritizes a custom ReactNode renderer over the built-in type', () => {
    const customNode = <s-badge tone="success">Custom</s-badge>;
    const renderCustom = vi.fn(() => customNode);
    const column: TableColumn<{name: string}> = {key: 'name', title: 'Name', type: 'text', render: renderCustom};
    const {container} = render(<>{renderCell(column, {name: 'Alice'}, formatOptions)}</>);
    expect(container.querySelector('s-badge')).toBeInTheDocument();
    expect(container).toHaveTextContent('Custom');
    expect(renderCustom).toHaveBeenCalledWith('Alice', {name: 'Alice'});
  });

  it('returns null for standalone actions and preserves a custom renderer result', () => {
    const actions: TableColumn<{id: string}> = {key: 'id', title: 'Actions', type: 'actions'};
    const custom: TableColumn<{id: string}> = {key: 'id', title: 'Custom', type: 'custom', render: () => EMPTY_CELL_PLACEHOLDER};
    expect(renderCell(actions, {id: '1'}, formatOptions)).toBeNull();
    expect(renderCell(custom, {id: '1'}, formatOptions)).toBe(EMPTY_CELL_PLACEHOLDER);
  });
});
