import {describe, expect, it} from 'vitest';
import {createFormatterPreset, shopifyFormatterPreset} from './formatters';

describe('formatter presets', () => {
  it('uses explicit shop defaults and supports overrides', () => {
    const preset = createFormatterPreset({locale: 'en-US', timeZone: 'UTC', defaultCurrencyCode: 'USD'});
    expect(preset.money(12)).toBe('$12.00');
    expect(preset.dateTime('2026-01-01T00:00:00Z')).toContain('Jan 1, 2026');
    expect(preset.status('missing')).toEqual({label: 'missing', tone: 'neutral'});
    expect(shopifyFormatterPreset({locale: 'de-DE', timeZone: 'UTC', defaultCurrencyCode: 'EUR'}).number(1000)).toBe('1.000');
    expect(createFormatterPreset({locale: 'en-US', timeZone: 'UTC', defaultCurrencyCode: 'USD', statusTone: {paid: 'success'}}).status('paid')).toEqual({label: 'paid', tone: 'success'});
  });
});
