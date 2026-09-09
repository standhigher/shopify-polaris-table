import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';

import {TableColumnVisibility} from '../index';
import type {TableColumn} from '../types';
import {useStorybookCopy} from './storybookI18n';

type Product = {id: string; title: string; status: string; inventory: number; price: string};

const columns: readonly TableColumn<Product>[] = [
  {key: 'title', title: 'Product', type: 'text'},
  {key: 'status', title: 'Status', type: 'status'},
  {key: 'inventory', title: 'Inventory', type: 'number'},
  {key: 'price', title: 'Price', type: 'money'},
];

const meta = {
  title: 'Components/Table Column Visibility',
  component: TableColumnVisibility,
  parameters: {docs: {description: {component: 'A controlled column chooser. The host persists visible keys and decides which columns cannot be hidden.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj;

function ColumnVisibilityExample() {
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(['title', 'status', 'inventory', 'price']);
  const {text} = useStorybookCopy();

  return <Card>
    <Text as="p" variant="bodyMd">{text('Open the chooser, then hide or restore optional columns. Product is intentionally required.', '打开列选择器，隐藏或恢复可选列。商品列被刻意设为必选。')}</Text>
    <div style={{marginTop: '1rem'}}>
      <TableColumnVisibility
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        requiredColumnKeys={['title']}
        onVisibleColumnsChange={(keys) => setVisibleColumnKeys([...keys])}
        label={text('Columns', '列')}
        resetLabel={text('Reset columns', '重置列')}
      />
    </div>
    <pre>{JSON.stringify(visibleColumnKeys, null, 2)}</pre>
  </Card>;
}

export const ControlledChooser: Story = {render: () => <ColumnVisibilityExample />};
