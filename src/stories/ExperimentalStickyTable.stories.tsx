import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {StickyTablePOC} from '../experimental/StickyTablePOC';

const rows = Array.from({length: 40}, (_, index) => ({
  id: String(index + 1), name: `Customer ${index + 1}`, status: index % 2 === 0 ? 'Active' : 'Draft',
  notes: 'This deliberately wide fixed-width column forces horizontal scrolling in the experiment.',
}));

const meta = {
  title: 'Advanced/Experimental Sticky Table',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Tests CSS sticky stacking only; not a public API or V1 Table replacement.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StickyHeaderAndEdgeColumns: Story = {
  render: () => <Card>
    <Text as="p" variant="bodySm">Scroll vertically and horizontally. Verify that header/edge stacking does not cover the wrong cell; row actions, selection, sorting, popovers, and dynamic widths are out of scope.</Text>
    <StickyTablePOC
      columns={[
        {id: 'name', heading: 'Customer', width: 180, sticky: 'start', render: (row) => row.name},
        {id: 'status', heading: 'Status', width: 160, render: (row) => row.status},
        {id: 'notes', heading: 'Notes', width: 380, render: (row) => row.notes},
        {id: 'action', heading: 'Action', width: 120, sticky: 'end', render: () => 'Open'},
      ]}
      rows={rows}
      rowId={(row) => row.id}
      viewportHeight={320}
      ariaLabel="Experimental sticky table"
    />
  </Card>,
};
