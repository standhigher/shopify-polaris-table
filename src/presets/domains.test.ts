import {describe, expect, it} from 'vitest';
import {createProductColumns} from './product';
import {createOrderColumns} from './order';
import {createCustomerColumns} from './customer';
import {createCampaignColumns} from './campaign';
import {createOfferColumns} from './offer';

describe('domain column presets', () => {
  it('provides overrideable product, order, customer, campaign and offer columns', () => {
    expect(createProductColumns()[0]?.key).toBe('title');
    expect(createOrderColumns()[0]?.key).toBe('name');
    expect(createCustomerColumns()[0]?.key).toBe('name');
    expect(createProductColumns({title: {title: 'Product'}})[0]?.title).toBe('Product');
    expect(createCampaignColumns()[0]?.key).toBe('name');
    expect(createOfferColumns()[0]?.key).toBe('name');
    expect(createCampaignColumns({name: {title: 'Campaign'}})[0]?.title).toBe('Campaign');
    expect(createOfferColumns({name: {title: 'Offer'}})[0]?.title).toBe('Offer');
  });
});
