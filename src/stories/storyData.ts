export type StoryProduct = {
  id: string;
  title: string;
  status: string;
  inventory: number;
  price: number;
  currencyCode: string;
  updatedAt: string;
};

export type StoryOrder = {
  id: string;
  name: string;
  customerName: string;
  financialStatus: string;
  fulfillmentStatus: string;
  total: number;
  currencyCode: string;
  createdAt: string;
};

export type StoryCustomer = {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  currencyCode: string;
  createdAt: string;
};

export type StoryCampaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  budget: number;
  spend: number;
  currencyCode: string;
  startsAt: string;
  endsAt: string;
};

export type StoryOffer = {
  id: string;
  name: string;
  type: string;
  status: string;
  discount: number;
  currencyCode: string;
  startsAt: string;
  endsAt: string;
};

const MOCK_ROW_COUNT = 50;
const currencies = ['USD', 'CAD', 'EUR', 'GBP'] as const;
const productTitles = ['Minimal Sneaker', 'Trail Jacket', 'Canvas Tote', 'Running Cap', 'Studio Hoodie'] as const;
const customerNames = ['Ava Rodriguez', 'Liam Chen', 'Mia Martin', 'Noah Smith', 'Emma Johnson', 'Oliver Brown', 'Sophia Davis', 'Lucas Wilson'] as const;
const financialStatuses = ['Paid', 'Pending', 'Refunded'] as const;
const fulfillmentStatuses = ['Fulfilled', 'Partial', 'Unfulfilled'] as const;
const campaignChannels = ['Email', 'Ads', 'SMS', 'Social', 'Push'] as const;
const campaignStatuses = ['Active', 'Paused', 'Draft'] as const;
const offerTypes = ['Percentage', 'Shipping', 'Fixed amount', 'Bundle'] as const;
const offerStatuses = ['Active', 'Scheduled', 'Expired'] as const;

function range(count: number): number[] {
  return Array.from({length: count}, (_, index) => index + 1);
}

function cycle<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function daysAgo(days: number): string {
  const date = new Date(Date.UTC(2026, 7, 14, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function daysFrom(startDay: number, offset: number): string {
  return new Date(Date.UTC(2026, 7, startDay + offset, 0, 0, 0)).toISOString();
}

export const storyProducts: readonly StoryProduct[] = range(MOCK_ROW_COUNT).map((number) => ({
  id: `p_${number}`,
  title: `${cycle(productTitles, number - 1)} ${number}`,
  status: number % 5 === 0 ? 'Draft' : 'Active',
  inventory: 8 + ((number * 17) % 140),
  price: Number((19 + ((number * 7) % 220) + 0.9).toFixed(2)),
  currencyCode: cycle(currencies, number - 1),
  updatedAt: daysAgo(number),
}));

export const storyOrders: readonly StoryOrder[] = range(MOCK_ROW_COUNT).map((number) => ({
  id: `o_${number}`,
  name: `#${1041 + number}`,
  customerName: cycle(customerNames, number - 1),
  financialStatus: cycle(financialStatuses, number - 1),
  fulfillmentStatus: cycle(fulfillmentStatuses, number),
  total: Number((48 + ((number * 23) % 480) + 0.5).toFixed(2)),
  currencyCode: cycle(currencies, number),
  createdAt: daysAgo(number - 1),
}));

export const storyCustomers: readonly StoryCustomer[] = range(MOCK_ROW_COUNT).map((number) => {
  const name = cycle(customerNames, number - 1);
  const emailName = name.toLowerCase().replaceAll(' ', '.');
  return {
    id: `c_${number}`,
    name: `${name} ${number}`,
    email: `${emailName}.${number}@example.com`,
    ordersCount: 1 + ((number * 3) % 26),
    totalSpent: Number((120 + ((number * 137) % 3600) + 0.75).toFixed(2)),
    currencyCode: cycle(currencies, number - 1),
    createdAt: daysAgo(number + 20),
  };
});

export const storyCampaigns: readonly StoryCampaign[] = range(MOCK_ROW_COUNT).map((number) => ({
  id: `m_${number}`,
  name: `${cycle(['August Launch', 'Retargeting Push', 'VIP Winback', 'Holiday Warmup', 'New Arrivals'], number - 1)} ${number}`,
  channel: cycle(campaignChannels, number - 1),
  status: cycle(campaignStatuses, number - 1),
  budget: 800 + ((number * 211) % 7200),
  spend: 120 + ((number * 137) % 5000),
  currencyCode: cycle(currencies, number - 1),
  startsAt: daysFrom(1, number - 1),
  endsAt: daysFrom(15, number - 1),
}));

export const storyOffers: readonly StoryOffer[] = range(MOCK_ROW_COUNT).map((number) => ({
  id: `of_${number}`,
  name: `${cycle(['Welcome', 'Free Shipping', 'VIP', 'Bundle', 'Retention'], number - 1)} ${number}`,
  type: cycle(offerTypes, number - 1),
  status: cycle(offerStatuses, number - 1),
  discount: cycle(offerTypes, number - 1) === 'Percentage' ? 5 + ((number * 5) % 35) : Number((10 + ((number * 3) % 90)).toFixed(2)),
  currencyCode: cycle(currencies, number - 1),
  startsAt: daysFrom(1, number - 1),
  endsAt: daysFrom(30, number - 1),
}));
