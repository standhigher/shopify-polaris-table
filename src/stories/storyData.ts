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

export const storyProducts: readonly StoryProduct[] = [
  {id: 'p_1', title: 'Minimal Sneaker', status: 'Active', inventory: 24, price: 89.9, currencyCode: 'USD', updatedAt: '2026-08-12T14:30:00.000Z'},
  {id: 'p_2', title: 'Trail Jacket', status: 'Active', inventory: 8, price: 139, currencyCode: 'USD', updatedAt: '2026-08-10T09:20:00.000Z'},
  {id: 'p_3', title: 'Canvas Tote', status: 'Draft', inventory: 120, price: 24.5, currencyCode: 'USD', updatedAt: '2026-08-09T17:45:00.000Z'},
  {id: 'p_4', title: 'Running Cap', status: 'Active', inventory: 57, price: 19, currencyCode: 'USD', updatedAt: '2026-08-08T08:10:00.000Z'},
];

export const storyOrders: readonly StoryOrder[] = [
  {id: 'o_1', name: '#1042', customerName: 'Ava Rodriguez', financialStatus: 'Paid', fulfillmentStatus: 'Fulfilled', total: 128.5, currencyCode: 'USD', createdAt: '2026-08-12T14:30:00.000Z'},
  {id: 'o_2', name: '#1043', customerName: 'Liam Chen', financialStatus: 'Pending', fulfillmentStatus: 'Unfulfilled', total: 89.99, currencyCode: 'CAD', createdAt: '2026-08-11T09:15:00.000Z'},
  {id: 'o_3', name: '#1044', customerName: 'Mia Martin', financialStatus: 'Refunded', fulfillmentStatus: 'Fulfilled', total: 240, currencyCode: 'USD', createdAt: '2026-08-10T18:45:00.000Z'},
  {id: 'o_4', name: '#1045', customerName: 'Noah Smith', financialStatus: 'Paid', fulfillmentStatus: 'Partial', total: 64.75, currencyCode: 'USD', createdAt: '2026-08-09T12:00:00.000Z'},
];

export const storyCustomers: readonly StoryCustomer[] = [
  {id: 'c_1', name: 'Ava Rodriguez', email: 'ava@example.com', ordersCount: 12, totalSpent: 1285.5, currencyCode: 'USD', createdAt: '2026-07-12T14:30:00.000Z'},
  {id: 'c_2', name: 'Liam Chen', email: 'liam@example.com', ordersCount: 5, totalSpent: 499.9, currencyCode: 'CAD', createdAt: '2026-06-11T09:15:00.000Z'},
  {id: 'c_3', name: 'Mia Martin', email: 'mia@example.com', ordersCount: 18, totalSpent: 2200, currencyCode: 'USD', createdAt: '2026-05-10T18:45:00.000Z'},
];

export const storyCampaigns: readonly StoryCampaign[] = [
  {id: 'm_1', name: 'August Launch', channel: 'Email', status: 'Active', budget: 4000, spend: 1730, currencyCode: 'USD', startsAt: '2026-08-01T00:00:00.000Z', endsAt: '2026-08-31T23:59:59.000Z'},
  {id: 'm_2', name: 'Retargeting Push', channel: 'Ads', status: 'Paused', budget: 2200, spend: 1800, currencyCode: 'USD', startsAt: '2026-08-05T00:00:00.000Z', endsAt: '2026-09-05T23:59:59.000Z'},
  {id: 'm_3', name: 'VIP Winback', channel: 'SMS', status: 'Draft', budget: 1200, spend: 0, currencyCode: 'USD', startsAt: '2026-08-15T00:00:00.000Z', endsAt: '2026-09-15T23:59:59.000Z'},
];

export const storyOffers: readonly StoryOffer[] = [
  {id: 'of_1', name: 'Welcome 10', type: 'Percentage', status: 'Active', discount: 10, currencyCode: 'USD', startsAt: '2026-08-01T00:00:00.000Z', endsAt: '2026-12-31T23:59:59.000Z'},
  {id: 'of_2', name: 'Free Shipping', type: 'Shipping', status: 'Active', discount: 0, currencyCode: 'USD', startsAt: '2026-07-01T00:00:00.000Z', endsAt: '2026-10-01T23:59:59.000Z'},
  {id: 'of_3', name: 'VIP 20', type: 'Percentage', status: 'Scheduled', discount: 20, currencyCode: 'USD', startsAt: '2026-09-01T00:00:00.000Z', endsAt: '2026-10-01T23:59:59.000Z'},
];
