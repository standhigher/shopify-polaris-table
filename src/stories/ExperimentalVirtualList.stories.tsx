import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {VirtualListPOC} from '../experimental/VirtualListPOC';
import {useStorybookCopy} from './storybookI18n';

const rows = Array.from({length: 10_000}, (_, index) => ({id: String(index), label: `Virtual row ${index + 1}`}));

const meta = {
  title: 'Internal experiments/Virtual List',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Fixed-height, non-interactive rows only; not a public API.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TenThousandFixedHeightRows: Story = {
  render: () => {
    const {text} = useStorybookCopy();
    return <Card>
      <Text as="p" variant="bodySm">{text('Internal experiment: only a small overscanned window of 10,000 fixed-height rows is mounted. It does not support actions, selection, dynamic heights, or focus movement.', '内部实验：10,000 个固定高度行中仅挂载少量超扫描窗口。不支持操作、选择、动态高度或焦点移动。')}</Text>
      <VirtualListPOC items={rows} itemKey={(row) => row.id} renderItem={(row) => row.label} itemSize={32} viewportSize={320} ariaLabel={text('Experimental virtual rows', '实验性虚拟行')} />
    </Card>;
  },
};
