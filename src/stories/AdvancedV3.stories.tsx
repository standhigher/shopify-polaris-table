import {Button, ButtonGroup, Card} from '@shopify/polaris';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useState} from 'react';

import {
  appendCursorPage,
  beginInlineEdit,
  calculateVirtualWindow,
  collapseRow,
  createColumnLayoutState,
  createCursorQuery,
  expandRow,
  isCursorQuery,
  isRowExpanded,
  reorderColumns,
  resolveInlineEdit,
  resizeColumn,
  setColumnVisibility,
  toggleRowExpanded,
  updateInlineEdit,
  validateInlineEdit,
} from '../index';
import type {ExpandableRowsState} from '../v3/expandable';

const meta = {title: 'Advanced/V3'} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CursorInfinite: Story = {
  name: 'Cursor Infinite',
  render: () => {
    const query = createCursorQuery({pageSize: 25, search: 'ada'});
    const initial = {items: [{id: 'a'}, {id: 'b'}], nextCursor: 'next', loading: false};
    const appended = appendCursorPage(initial, {data: [{id: 'b'}, {id: 'c'}], nextCursor: null}, (row) => row.id);
    return <Card><pre>{JSON.stringify({query, isCursorQuery: isCursorQuery(query), appended}, null, 2)}</pre></Card>;
  },
};

export const VirtualWindow: Story = {
  name: 'Virtual Window',
  render: () => {
    const [scrollOffset, setScrollOffset] = useState(200);
    const window = useMemo(() => calculateVirtualWindow({itemCount: 100, itemSize: 20, scrollOffset, viewportSize: 100, overscan: 2}), [scrollOffset]);
    return <Card><pre>{JSON.stringify(window, null, 2)}</pre><Button onClick={() => setScrollOffset((current) => current + 40)}>Scroll forward</Button></Card>;
  },
};

export const ColumnLayout: Story = {
  name: 'Column Layout',
  render: () => {
    const [state, setState] = useState(createColumnLayoutState([
      {id: 'name', width: 160, minWidth: 120, maxWidth: 240, sticky: 'start'},
      {id: 'status', width: 100},
      {id: 'total', width: 140, sticky: 'end'},
    ]));
    return <Card>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <ButtonGroup>
        <Button onClick={() => setState((current) => resizeColumn(current, 'name', 200))}>Resize name</Button>
        <Button onClick={() => setState((current) => reorderColumns(current, 'total', 0))}>Move total first</Button>
        <Button onClick={() => setState((current) => setColumnVisibility(current, 'status', false))}>Hide status</Button>
      </ButtonGroup>
    </Card>;
  },
};

export const ExpandableRows: Story = {
  name: 'Expandable Rows',
  render: () => {
    const [state, setState] = useState<ExpandableRowsState>({expandedIds: ['a']});
    return <Card>
      <pre>{JSON.stringify({expandedIds: state.expandedIds, isExpanded: isRowExpanded(state, 'a')}, null, 2)}</pre>
      <ButtonGroup>
        <Button onClick={() => setState((current) => toggleRowExpanded(current, 'a'))}>Toggle a</Button>
        <Button onClick={() => setState((current) => expandRow(current, 'b'))}>Expand b</Button>
        <Button onClick={() => setState((current) => collapseRow(current, 'a'))}>Collapse a</Button>
      </ButtonGroup>
    </Card>;
  },
};

export const InlineEdit: Story = {
  name: 'Inline Edit',
  render: () => {
    const [session, setSession] = useState(beginInlineEdit('row-1', {name: 'Ada', quantity: 1}, 'v1'));
    const checked = validateInlineEdit(session, (draft) => draft.quantity > 0 ? [] : [{field: 'quantity', message: 'Must be positive'}]);
    return <Card>
      <pre>{JSON.stringify(checked.session, null, 2)}</pre>
      <ButtonGroup>
        <Button onClick={() => setSession((current) => updateInlineEdit(current, {quantity: current.draft.quantity + 1}))}>Increment</Button>
        <Button onClick={() => setSession((current) => resolveInlineEdit(current, {status: 'saved', version: 'v2'}))}>Save</Button>
        <Button onClick={() => setSession((current) => resolveInlineEdit(current, {status: 'conflict', version: 'v3'}))}>Conflict</Button>
      </ButtonGroup>
    </Card>;
  },
};
