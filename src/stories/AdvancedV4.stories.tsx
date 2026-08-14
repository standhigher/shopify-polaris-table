import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {
  assertPolarisRendererAdapter,
  createCoreSchema,
  createPolarisRendererAdapter,
  normalizeCoreQuery,
  updateCoreQuery,
  validateCoreSchema,
} from '../index';

const meta = {title: 'Advanced/V4'} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoreSchemaAndAdapter: Story = {
  name: 'Core Schema and Adapter',
  render: () => {
    const schema = createCoreSchema({
      rowId: 'id',
      columns: [
        {id: 'name', title: 'Name', type: 'text', sortable: true},
        {id: 'status', title: 'Status', type: 'status'},
      ],
    });
    const query = normalizeCoreQuery({page: 0, pageSize: 0, search: ' ', filters: {active: {operator: 'equals', value: true}}});
    const updated = updateCoreQuery(query, {search: 'Ada'});
    const adapter = createPolarisRendererAdapter({
      renderTable: ({rows}) => rows.length,
      renderHeader: ({columns}) => columns.map((column) => column.title).join(', '),
      renderCell: ({value}) => String(value ?? ''),
    });
    return <Card>
      <Text as="p" variant="bodyMd">Core schema and renderer adapters stay UI-framework neutral until the boundary.</Text>
      <pre>{JSON.stringify({schema, validation: validateCoreSchema(schema), query, updated, adapterOk: assertPolarisRendererAdapter(adapter)}, null, 2)}</pre>
    </Card>;
  },
};
