import {describe, expect, it} from 'vitest';
import {createProductColumns} from './product';
import {createOrderColumns} from './order';
import {createCustomerColumns} from './customer';

describe('domain column presets', () => {
  it('provides overrideable product, order and customer columns', () => {
    expect(createProductColumns()[0]?.key).toBe('title');
    expect(createOrderColumns()[0]?.key).toBe('name');
    expect(createCustomerColumns()[0]?.key).toBe('name');
    expect(createProductColumns({title: {title: 'Product'}})[0]?.title).toBe('Product');
  });
});
