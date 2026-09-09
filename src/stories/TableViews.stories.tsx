import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {TableViews, createTableViewManager} from '../index';
import type {TableQuery} from '../types';
import type {TableViewRepository} from '../views/tableViews';
import {useStorybookCopy} from './storybookI18n';

const repository: TableViewRepository = {
  list: async () => [],
  create: async (input) => ({id: `view_${input.name.toLowerCase().replaceAll(' ', '_')}`, updatedAt: '2026-09-09T00:00:00.000Z', ...input}),
  update: async (input) => ({id: input.id, name: input.name ?? 'Saved view', query: input.query ?? {page: 1, pageSize: 25}, visibleColumnKeys: input.visibleColumnKeys ?? ['title'], owner: 'demo', updatedAt: '2026-09-09T00:00:00.000Z'}),
  remove: async () => undefined,
};

const meta = {
  title: 'Components/Table Views',
  component: TableViews,
  parameters: {docs: {description: {component: 'A controlled saved-view editor. Persistence, authorization, and stale-write policy stay behind the host repository.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj;

function TableViewsExample() {
  const manager = useMemo(() => createTableViewManager(repository), []);
  const [views, setViews] = useState<Awaited<ReturnType<typeof repository.create>>[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string>();
  const query: TableQuery = {page: 1, pageSize: 25, filters: {status: {operator: 'equals', value: 'Active'}}};
  const {text} = useStorybookCopy();

  return <Card>
    <Text as="p" variant="bodyMd">{text('Create a view, select it, then save or delete it. The mock repository is deliberately local to this story.', '创建视图并选中它，然后保存或删除。此模拟仓库仅限本故事使用。')}</Text>
    <div style={{marginTop: '1rem'}}>
      <TableViews
        manager={manager}
        views={views}
        owner="demo"
        query={query}
        visibleColumnKeys={['title', 'status', 'inventory']}
        {...(selectedViewId ? {selectedViewId} : {})}
        labels={{savedView: text('Saved view', '已保存视图'), noSavedView: text('No saved view', '未选择已保存视图'), viewName: text('View name', '视图名称'), createView: text('Create view', '创建视图'), renameView: text('Rename view', '重命名视图'), saveView: text('Save view', '保存视图'), deleteView: text('Delete view', '删除视图')}}
        onSelectedViewChange={(view) => setSelectedViewId(view?.id)}
        onViewsChange={(nextViews) => setViews([...nextViews])}
      />
    </div>
    <pre>{JSON.stringify(views, null, 2)}</pre>
  </Card>;
}

export const ControlledSavedViews: Story = {render: () => <TableViewsExample />};
