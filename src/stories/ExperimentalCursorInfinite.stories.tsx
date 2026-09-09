import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {CursorInfinitePOC} from '../experimental/CursorInfinitePOC';

type Row = {id: string; label: string};

const pages: Record<string, {data: readonly Row[]; nextCursor: string | null}> = {
  next: {data: [{id: '2', label: 'Second row'}, {id: '3', label: 'Third row'}], nextCursor: 'last'},
  last: {data: [{id: '3', label: 'Repeated third row'}, {id: '4', label: 'Final row'}], nextCursor: null},
};

const meta = {
  title: 'Advanced/Experimental Cursor Infinite',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Exercises V3 cursor loading, deduplication and retry only; it is not a public API or V1 pagination replacement.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadMoreWithDeduplication: Story = {
  render: () => <Card>
    <Text as="p" variant="bodySm">Load the two sample cursor pages. The second page intentionally repeats a row; failures can be simulated by disconnecting the request in a host integration.</Text>
    <CursorInfinitePOC
      initialItems={[{id: '1', label: 'First row'}, {id: '2', label: 'Duplicate second row'}]}
      initialNextCursor="next"
      pageSize={2}
      getItemId={(row) => row.id}
      renderItem={(row) => row.label}
      loadPage={async ({cursor}) => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return pages[cursor] ?? {data: [], nextCursor: null};
      }}
      ariaLabel="Experimental cursor rows"
    />
  </Card>,
};
