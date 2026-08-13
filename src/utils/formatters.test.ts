import {describe, expect, it, vi} from 'vitest';

import {
  EMPTY_CELL_PLACEHOLDER,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatText,
  resolveCurrencyCode,
} from './formatters';

describe('formatters', () => {
  const formatOptions = {
    locale: 'en-US',
    timeZone: 'Asia/Shanghai',
    defaultCurrencyCode: 'CNY',
  };

  it('uses a placeholder for nullish and empty values while retaining zero', () => {
    expect(formatText(null)).toBe(EMPTY_CELL_PLACEHOLDER);
    expect(formatText(undefined)).toBe(EMPTY_CELL_PLACEHOLDER);
    expect(formatText('')).toBe(EMPTY_CELL_PLACEHOLDER);
    expect(formatText(0)).toBe('0');
    expect(formatNumber(0, formatOptions)).toBe('0');
  });

  it('truncates Unicode text without splitting characters', () => {
    expect(formatText('你好世界', {maxLength: 3})).toBe('你好世…');
    expect(formatText('abcdef', {maxLength: 3})).toBe('abc…');
  });

  it('formats negative numbers with the provided locale', () => {
    expect(formatNumber(-1234.5, formatOptions)).toBe('-1,234.5');
  });

  it('uses row currency before column and default currency', () => {
    const column = {
      key: 'total',
      title: 'Total',
      type: 'money' as const,
      currencyCode: (row: {currency: string}) => row.currency,
    };

    expect(resolveCurrencyCode({currency: 'EUR'}, column, formatOptions)).toBe('EUR');
    expect(
      resolveCurrencyCode(
        {currency: undefined},
        {...column, currencyCode: 'USD'},
        formatOptions,
      ),
    ).toBe('USD');
    expect(
      resolveCurrencyCode({currency: undefined}, {key: 'total', title: 'Total'}, formatOptions),
    ).toBe('CNY');
  });

  it('formats money using a resolved currency code', () => {
    expect(formatMoney(-1234.5, {locale: 'en-US', currencyCode: 'USD'})).toBe('-$1,234.50');
  });

  it('keeps the locale-formatted amount and reports a warning when no currency is available', () => {
    const onWarning = vi.fn();

    expect(formatMoney(1234.5, {locale: 'en-US', onWarning})).toBe('1,234.5');
    expect(onWarning).toHaveBeenCalledWith({columnKey: 'total', reason: 'missing-currency-code'});
  });

  it('formats dates in the explicitly provided shop time zone', () => {
    expect(
      formatDateTime('2026-08-13T00:30:00.000Z', {
        locale: 'en-US',
        timeZone: 'Asia/Shanghai',
      }),
    ).toBe('Aug 13, 2026, 8:30 AM');
  });

  it('returns the placeholder for invalid dates', () => {
    expect(formatDateTime('not-a-date', formatOptions)).toBe(EMPTY_CELL_PLACEHOLDER);
  });
});
