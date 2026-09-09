import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useState} from 'react';

import {ExpandableInlineEditPOC} from '../experimental/ExpandableInlineEditPOC';
import type {ExpandableInlineEditPOCRow} from '../experimental/ExpandableInlineEditPOC';
import {useStorybookCopy} from './storybookI18n';

const initialRows: readonly ExpandableInlineEditPOCRow[] = [
  {id: 'ada', name: 'Ada Lovelace', details: 'Versioned profile data supplied by the host.', version: 'v1'},
  {id: 'grace', name: 'Grace Hopper', details: 'A second row to exercise controlled expansion.', version: 'v3'},
];

function ControlledExample() {
  const [rows, setRows] = useState(initialRows);
  const [expandedIds, setExpandedIds] = useState<readonly string[]>([]);

  return <ExpandableInlineEditPOC
    rows={rows}
    expandedIds={expandedIds}
    onExpandedIdsChange={setExpandedIds}
    ariaLabel="Experimental expandable inline edit rows"
    onSave={async (request) => {
      const current = rows.find((row) => row.id === request.rowId);
      if (!current || current.version !== request.version) return {status: 'conflict', version: current?.version ?? request.version};
      const version = `${current.version}-next`;
      setRows((currentRows) => currentRows.map((row) => row.id === request.rowId ? {...row, name: request.draft.name, version} : row));
      return {status: 'saved', version};
    }}
  />;
}

const meta = {
  title: 'Internal experiments/Expandable Inline Edit',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Demonstrates controlled writes, version conflicts and detail focus only; it is not a public API.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlledWritesAndVersionConflicts: Story = {
  render: () => {
    const {text} = useStorybookCopy();
    return <Card>
      <Text as="p" variant="bodySm">{text('Internal experiment: expand a row and edit its name. The host owns persistence and accepts the versioned draft before replacing the canonical row. Test focus and cancel behavior before considering a public API.', '内部实验：展开一行并编辑名称。宿主拥有持久化权，并在接受带版本草稿后才替换规范行。公开 API 前须验证焦点与取消行为。')}</Text>
      <ControlledExample />
    </Card>;
  },
};
