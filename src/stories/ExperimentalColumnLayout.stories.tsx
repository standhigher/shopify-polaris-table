import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';

import {ColumnLayoutPOC} from '../experimental/ColumnLayoutPOC';
import {createColumnLayoutState} from '../v3/columns';

const rows = [
  {id: '1', customer: 'Ada Lovelace', status: 'Active', total: '$320.00'},
  {id: '2', customer: 'Grace Hopper', status: 'Draft', total: '$84.00'},
  {id: '3', customer: 'Margaret Hamilton', status: 'Active', total: '$1,280.00'},
];

const initialLayout = createColumnLayoutState([
  {id: 'customer', width: 180, minWidth: 120, maxWidth: 300},
  {id: 'status', width: 130, minWidth: 100, maxWidth: 180},
  {id: 'total', width: 140, minWidth: 110, maxWidth: 220},
]);

const meta = {
  title: 'Advanced/Experimental Column Layout',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Controlled resize/reorder boundaries only; not a public API or a drag-and-drop implementation.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlledResizeAndReorder: Story = {
  render: function Render() {
    const [layout, setLayout] = useState(initialLayout);
    return <Card>
      <Text as="p" variant="bodySm">Use the header arrow buttons or Alt+ArrowLeft / Alt+ArrowRight to reorder. Range controls resize each column. State is controlled in the host; persistence, drag-and-drop, sticky columns, and V1 Table integration are deliberately out of scope.</Text>
      <ColumnLayoutPOC
        columns={[
          {id: 'customer', heading: 'Customer', minWidth: 120, maxWidth: 300, render: (row) => row.customer},
          {id: 'status', heading: 'Status', minWidth: 100, maxWidth: 180, render: (row) => row.status},
          {id: 'total', heading: 'Total', minWidth: 110, maxWidth: 220, render: (row) => row.total},
        ]}
        layout={layout}
        onLayoutChange={setLayout}
        rows={rows}
        rowId={(row) => row.id}
        ariaLabel="Experimental controlled column layout"
      />
    </Card>;
  },
};
