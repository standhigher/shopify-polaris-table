import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {StickyTablePOC} from '../experimental/StickyTablePOC';
import {useStorybookCopy} from './storybookI18n';

const rows = Array.from({length: 40}, (_, index) => ({
  id: String(index + 1), name: `Customer ${index + 1}`, status: index % 2 === 0 ? 'Active' : 'Draft',
  notes: 'This deliberately wide fixed-width column forces horizontal scrolling in the experiment.',
}));

const meta = {
  title: 'Internal experiments/Sticky Table',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Tests CSS sticky stacking only; not a public API or V1 Table replacement.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const StickyHeaderAndEdgeColumns: Story = {
  render: () => {
    const {text} = useStorybookCopy();
    return <Card>
      <Text as="p" variant="bodySm">{text('Internal experiment: scroll vertically and horizontally. Verify that header and edge stacking do not cover the wrong cell; actions, selection, sorting, popovers, and dynamic widths are out of scope.', '内部实验：纵向和横向滚动，验证表头与边缘堆叠不会遮挡错误单元格；操作、选择、排序、弹出层与动态宽度不在范围内。')}</Text>
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
        ariaLabel={text('Experimental sticky table', '实验性固定表格')}
      />
    </Card>;
  },
};
