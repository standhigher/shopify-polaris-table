import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {VirtualListPOC} from '../experimental/VirtualListPOC';

const rows = Array.from({length: 10_000}, (_, index) => ({id: String(index), label: `Virtual row ${index + 1}`}));

const meta = {
  title: 'Advanced/Experimental Virtual List',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Fixed-height, non-interactive rows only; not a public API.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TenThousandFixedHeightRows: Story = {
  render: () => <Card>
    <Text as="p" variant="bodySm">Only a small overscanned window of 10,000 fixed-height rows is mounted. This POC does not support row actions, selection, dynamic heights, or focus movement.</Text>
    <VirtualListPOC
      items={rows}
      itemKey={(row) => row.id}
      renderItem={(row) => row.label}
      itemSize={32}
      viewportSize={320}
      ariaLabel="Experimental virtual rows"
    />
  </Card>,
};
