import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';

import {ColumnLayoutPOC} from '../experimental/ColumnLayoutPOC';
import {createColumnLayoutState} from '../v3/columns';
import {useStorybookCopy} from './storybookI18n';

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
  title: 'Internal experiments/Column Layout',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Controlled resize/reorder boundaries only; not a public API or a drag-and-drop implementation.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlledResizeAndReorder: Story = {
  render: function Render() {
    const [layout, setLayout] = useState(initialLayout);
    const {text} = useStorybookCopy();
    return <Card>
      <Text as="p" variant="bodySm">{text('Internal experiment: use header arrows or Alt+ArrowLeft / Alt+ArrowRight to reorder. Range controls resize columns. Persistence, drag-and-drop, sticky columns, and V1 Table integration remain out of scope.', '内部实验：使用表头箭头或 Alt+方向键调整顺序，范围控件调整列宽。持久化、拖放、固定列与 V1 Table 集成均不在范围内。')}</Text>
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
        ariaLabel={text('Experimental controlled column layout', '实验性受控列布局')}
      />
    </Card>;
  },
};
