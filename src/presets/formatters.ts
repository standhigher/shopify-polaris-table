import type {TableFormatOptions, TableStatusTone} from '../types';
import {formatDateTime, formatMoney, formatNumber, formatText} from '../utils/formatters';

export interface FormatterPresetOptions extends TableFormatOptions {
  statusTone?: Readonly<Record<string, TableStatusTone>>;
}

export interface TableFormatterPreset {
  text: (value: unknown) => string;
  number: (value: unknown) => string;
  money: (value: unknown, currencyCode?: string) => string;
  dateTime: (value: unknown, timeZone?: string) => string;
  status: (value: unknown) => {label: string; tone: TableStatusTone | 'neutral'};
}

/** Builds deterministic business defaults from explicit shop configuration. */
export function createFormatterPreset(options: FormatterPresetOptions): TableFormatterPreset {
  return {
    text: formatText,
    number: (value) => formatNumber(value, options),
    money: (value, currencyCode) => formatMoney(value, {locale: options.locale, ...(currencyCode ? {currencyCode} : options.defaultCurrencyCode ? {currencyCode: options.defaultCurrencyCode} : {})}),
    dateTime: (value, timeZone) => formatDateTime(value, {locale: options.locale, timeZone: timeZone ?? options.timeZone}),
    status: (value) => ({label: formatText(value), tone: options.statusTone?.[String(value)] ?? 'neutral'}),
  };
}

/** Shopify-oriented alias kept explicit so consuming apps can choose their own defaults. */
export const shopifyFormatterPreset = createFormatterPreset;
