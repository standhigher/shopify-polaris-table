import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import type {TableColumn, TableFormatOptions} from '../types';
import {renderCell} from './renderCell';

describe('renderCell', () => {
  const formatOptions: TableFormatOptions = {
    locale: 'en-US',
    timeZone: 'Asia/Shanghai',
    defaultCurrencyCode: 'USD',
  };

  it('renders the default text renderer and placeholder', () => {
    const column: TableColumn<{name: string | null}> = {key: 'name', title: 'Name', type: 'text'};

    const {container, rerender} = render(<>{renderCell(column, {name: 'Alice'}, formatOptions)}</>);
    expect(screen.getByText('Alice')).toBeInTheDocument();

    rerender(<>{renderCell(column, {name: null}, formatOptions)}</>);
    expect(container).toHaveTextContent('—');
  });

  it('lets a custom renderer override the type renderer', () => {
    const renderCustom = vi.fn((value: unknown, row: {name: string}) => `${row.name}:${String(value)}`);
    const column: TableColumn<{name: string}> = {
      key: 'name',
      title: 'Name',
      type: 'text',
      render: renderCustom,
    };

    render(<>{renderCell(column, {name: 'Alice'}, formatOptions)}</>);
    expect(screen.getByText('Alice:Alice')).toBeInTheDocument();
    expect(renderCustom).toHaveBeenCalledWith('Alice', {name: 'Alice'});
  });

  it('renders status labels with a neutral tone for unknown values', () => {
    const column: TableColumn<{status: string}> = {
      key: 'status',
      title: 'Status',
      type: 'status',
      statusTone: {active: 'success'},
    };

    const {container} = render(<>{renderCell(column, {status: 'mystery'}, formatOptions)}</>);
    expect(screen.getByText('mystery')).toBeInTheDocument();
    expect(container.querySelector('[data-tone="neutral"]')).not.toBeNull();
  });

  it('renders an image placeholder for missing or invalid URLs', () => {
    const column: TableColumn<{image: string | null}> = {key: 'image', title: 'Image', type: 'image'};
    const {container} = render(<>{renderCell(column, {image: null}, formatOptions)}</>);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('—');
  });
});
