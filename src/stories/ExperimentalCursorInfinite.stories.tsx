import {Card, Text} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';

import {CursorInfinitePOC} from '../experimental/CursorInfinitePOC';
import {useStorybookCopy} from './storybookI18n';

type Row = {id: string; label: string};

const pages: Record<string, {data: readonly Row[]; nextCursor: string | null}> = {
  next: {data: [{id: '2', label: 'Second row'}, {id: '3', label: 'Third row'}], nextCursor: 'last'},
  last: {data: [{id: '3', label: 'Repeated third row'}, {id: '4', label: 'Final row'}], nextCursor: null},
};

const meta = {
  title: 'Internal experiments/Cursor Infinite',
  parameters: {docs: {description: {component: 'Internal 0.8 POC. Exercises V3 cursor loading, deduplication and retry only; it is not a public API or V1 pagination replacement.'}}},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoadMoreWithDeduplication: Story = {
  render: () => {
    const {text} = useStorybookCopy();
    return <Card>
      <Text as="p" variant="bodySm">{text('Internal experiment: load two cursor pages. The second intentionally repeats a row; host integrations should also verify failed requests.', '内部实验：加载两页游标数据。第二页故意重复一行；宿主集成还应验证请求失败。')}</Text>
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
        ariaLabel={text('Experimental cursor rows', '实验性游标行')}
      />
    </Card>;
  },
};
