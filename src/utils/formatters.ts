import type {TableColumn, TableFormatOptions, TableFormatWarning} from '../types';

export const EMPTY_CELL_PLACEHOLDER = '—';

interface FormatTextOptions {
  maxLength?: number;
}

interface FormatMoneyOptions {
  locale: string;
  currencyCode?: string;
  columnKey?: string;
  onWarning?: (warning: TableFormatWarning) => void;
}

interface FormatDateTimeOptions {
  locale: string;
  timeZone: string;
}

export function formatText(value: unknown, options: FormatTextOptions = {}): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_CELL_PLACEHOLDER;
  }

  const text = String(value);
  if (options.maxLength === undefined || options.maxLength < 1) {
    return text;
  }

  const characters = Array.from(text);
  return characters.length > options.maxLength ? `${characters.slice(0, options.maxLength).join('')}…` : text;
}

export function formatNumber(value: unknown, options: Pick<TableFormatOptions, 'locale'>): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_CELL_PLACEHOLDER;
  }

  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    return EMPTY_CELL_PLACEHOLDER;
  }

  return new Intl.NumberFormat(options.locale).format(number);
}

export function resolveCurrencyCode<T extends object>(
  row: T,
  column: TableColumn<T>,
  formatOptions: TableFormatOptions,
): string | undefined {
  if (typeof column.currencyCode === 'function') {
    const rowCurrencyCode = column.currencyCode(row);
    if (rowCurrencyCode) {
      return rowCurrencyCode;
    }
  } else if (column.currencyCode) {
    return column.currencyCode;
  }

  return formatOptions.defaultCurrencyCode;
}

export function formatMoney(value: unknown, options: FormatMoneyOptions): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_CELL_PLACEHOLDER;
  }

  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return EMPTY_CELL_PLACEHOLDER;
  }

  if (!options.currencyCode) {
    options.onWarning?.({
      columnKey: options.columnKey ?? 'total',
      reason: 'missing-currency-code',
    });
    return new Intl.NumberFormat(options.locale).format(amount);
  }

  try {
    return new Intl.NumberFormat(options.locale, {
      style: 'currency',
      currency: options.currencyCode,
    }).format(amount);
  } catch {
    options.onWarning?.({
      columnKey: options.columnKey ?? 'total',
      reason: 'missing-currency-code',
    });
    return new Intl.NumberFormat(options.locale).format(amount);
  }
}

export function formatDateTime(value: unknown, options: FormatDateTimeOptions): string {
  if (value === null || value === undefined || value === '') {
    return EMPTY_CELL_PLACEHOLDER;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return EMPTY_CELL_PLACEHOLDER;
  }

  try {
    return new Intl.DateTimeFormat(options.locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: options.timeZone,
    }).format(date);
  } catch {
    return EMPTY_CELL_PLACEHOLDER;
  }
}
