import type {ReactNode} from 'react';

import type {TableColumn, TableFormatOptions} from '../types';
import {EMPTY_CELL_PLACEHOLDER, formatDateTime, formatMoney, formatNumber, formatText, resolveCurrencyCode} from '../utils/formatters';

export function getColumnValue<T extends object>(column: TableColumn<T>, row: T): unknown {
  return row[column.key as keyof T];
}

export function renderCell<T extends object>(
  column: TableColumn<T>,
  row: T,
  formatOptions: TableFormatOptions,
  onFormatWarning?: (warning: {columnKey: string; reason: 'missing-currency-code'}) => void,
): ReactNode {
  const value = getColumnValue(column, row);
  if (column.render) {
    return column.render(value, row);
  }

  switch (column.type) {
    case 'number':
      return formatNumber(value, formatOptions);
    case 'money':
      const currencyCode = resolveCurrencyCode(row, column, formatOptions);
      return formatMoney(value, {
        locale: formatOptions.locale,
        ...(currencyCode ? {currencyCode} : {}),
        columnKey: String(column.key),
        ...(onFormatWarning ? {onWarning: onFormatWarning} : {}),
      });
    case 'datetime':
      return formatDateTime(value, {
        locale: formatOptions.locale,
        timeZone: column.timeZone ?? formatOptions.timeZone,
      });
    case 'status': {
      const label = formatText(value);
      if (label === EMPTY_CELL_PLACEHOLDER) {
        return label;
      }
      const tone = column.statusTone?.[String(value)];
      return <s-badge tone={tone ?? 'neutral'}>{label}</s-badge>;
    }
    case 'image': {
      if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
        return EMPTY_CELL_PLACEHOLDER;
      }
      const alt = typeof column.imageAlt === 'function' ? column.imageAlt(row) : column.imageAlt ?? '';
      // Polaris owns loading/error placeholders; never remove React-managed nodes.
      return <s-thumbnail src={value} alt={alt} size="small" />;
    }
    case 'actions':
      return null;
    case 'custom':
      return EMPTY_CELL_PLACEHOLDER;
    case 'text':
    case undefined:
      return formatText(value);
    default:
      return formatText(value);
  }
}
