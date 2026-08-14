import {Button, ButtonGroup, Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {
  calculateVirtualWindow,
  createColumnLayoutState,
  createCoreSchema,
  createPolarisRendererAdapter,
  getStickyOffsets,
  normalizeCoreQuery,
  reorderColumns,
  resizeColumn,
  setColumnVisibility,
  validateCoreSchema,
} from '../index';

const meta = {
  title: 'Advanced/Overview',
  parameters: {
    docs: {
      description: {
        component: 'Advanced stories surface the lower-level helpers that power the table under the hood.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const StateHelpersPreview: Story = {
  name: 'State Helpers Preview',
  render: () => {
    const [layout, setLayout] = useState(createColumnLayoutState([
      {id: 'name', width: 160, sticky: 'start'},
      {id: 'status', width: 120},
      {id: 'total', width: 140, sticky: 'end'},
    ]));

    const query = normalizeCoreQuery({page: 0, pageSize: 0, search: ' '});
    const schema = createCoreSchema({
      rowId: 'id',
      columns: [
        {id: 'name', title: 'Name', type: 'text', sortable: true},
        {id: 'status', title: 'Status', type: 'status'},
      ],
    });
    const window = useMemo(() => calculateVirtualWindow({itemCount: 100, itemSize: 20, scrollOffset: 200, viewportSize: 100, overscan: 2}), []);
    const adapter = createPolarisRendererAdapter({
      renderTable: ({rows}) => rows.length,
      renderHeader: ({columns}) => columns.length,
      renderCell: ({value}) => String(value ?? ''),
    });

    return <Card>
      <Text as="p" variant="bodyMd">Advanced stories should reveal the moving pieces: layout, virtual windows, schemas, and adapters.</Text>
      <pre>{JSON.stringify({schemaErrors: validateCoreSchema(schema), query, window, stickyOffsets: getStickyOffsets(layout), adapterRenderer: adapter.renderer}, null, 2)}</pre>
      <ButtonGroup>
        <Button onClick={() => setLayout((current) => resizeColumn(current, 'name', 200))}>Resize name</Button>
        <Button onClick={() => setLayout((current) => reorderColumns(current, 'total', 0))}>Move total</Button>
        <Button onClick={() => setLayout((current) => setColumnVisibility(current, 'status', false))}>Hide status</Button>
      </ButtonGroup>
    </Card>;
  },
};
