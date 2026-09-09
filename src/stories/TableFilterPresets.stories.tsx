import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';

import {TableFilterPresets} from '../index';
import type {TableQuery} from '../types';
import {useStorybookCopy} from './storybookI18n';

const meta = {
  title: 'Components/Table Filter Presets',
  component: TableFilterPresets,
  parameters: {docs: {description: {component: 'Curated filter-only shortcuts. Applying a preset changes query filters while the host retains query ownership.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj;

function FilterPresetsExample() {
  const [query, setQuery] = useState<TableQuery>({page: 2, pageSize: 25, search: 'shoe'});
  const {text} = useStorybookCopy();
  const presets = [
    {id: 'active', label: text('Active', '已启用'), filters: {status: {operator: 'equals' as const, value: 'Active'}}},
    {id: 'low-stock', label: text('Low inventory', '低库存'), filters: {inventory: {operator: 'between' as const, value: {to: 10}}}},
  ];

  return <Card>
    <Text as="p" variant="bodyMd">{text('Try a preset to replace filters and reset the page without changing the search term.', '选择预设会替换筛选条件并重置页码，但不会修改搜索词。')}</Text>
    <div style={{marginTop: '1rem'}}><TableFilterPresets presets={presets} query={query} onQueryChange={setQuery} /></div>
    <pre>{JSON.stringify(query, null, 2)}</pre>
  </Card>;
}

export const ControlledPresets: Story = {render: () => <FilterPresetsExample />};
