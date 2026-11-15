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

const meta = {title: 'Advanced helpers/V3'} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CursorInfinite: Story = {
  name: 'Cursor Infinite',
  render: () => {
    const query = createCursorQuery({pageSize: 25, search: 'ada'});
    const initial = {items: [{id: 'a'}, {id: 'b'}], nextCursor: 'next', loading: false};
    const appended = appendCursorPage(initial, {data: [{id: 'b'}, {id: 'c'}], nextCursor: null}, (row) => row.id);
    return <s-section><pre>{JSON.stringify({query, isCursorQuery: isCursorQuery(query), appended}, null, 2)}</pre></s-section>;
  },
};

export const VirtualWindow: Story = {
  name: 'Virtual Window',
  render: () => {
    const [scrollOffset, setScrollOffset] = useState(200);
    const window = useMemo(() => calculateVirtualWindow({itemCount: 100, itemSize: 20, scrollOffset, viewportSize: 100, overscan: 2}), [scrollOffset]);
    return <s-section><pre>{JSON.stringify(window, null, 2)}</pre><s-button onClick={() => setScrollOffset((current) => current + 40)}>Scroll forward</s-button></s-section>;
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
    return <s-section>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <s-button-group>
        <s-button onClick={() => setState((current) => resizeColumn(current, 'name', 200))}>Resize name</s-button>
        <s-button onClick={() => setState((current) => reorderColumns(current, 'total', 0))}>Move total first</s-button>
        <s-button onClick={() => setState((current) => setColumnVisibility(current, 'status', false))}>Hide status</s-button>
      </s-button-group>
    </s-section>;
  },
};

export const ExpandableRows: Story = {
  name: 'Expandable Rows',
  render: () => {
    const [state, setState] = useState<ExpandableRowsState>({expandedIds: ['a']});
    return <s-section>
      <pre>{JSON.stringify({expandedIds: state.expandedIds, isExpanded: isRowExpanded(state, 'a')}, null, 2)}</pre>
      <s-button-group>
        <s-button onClick={() => setState((current) => toggleRowExpanded(current, 'a'))}>Toggle a</s-button>
        <s-button onClick={() => setState((current) => expandRow(current, 'b'))}>Expand b</s-button>
        <s-button onClick={() => setState((current) => collapseRow(current, 'a'))}>Collapse a</s-button>
      </s-button-group>
    </s-section>;
  },
};

export const InlineEdit: Story = {
  name: 'Inline Edit',
  render: () => {
    const [session, setSession] = useState(beginInlineEdit('row-1', {name: 'Ada', quantity: 1}, 'v1'));
    const checked = validateInlineEdit(session, (draft) => draft.quantity > 0 ? [] : [{field: 'quantity', message: 'Must be positive'}]);
    return <s-section>
      <pre>{JSON.stringify(checked.session, null, 2)}</pre>
      <s-button-group>
        <s-button onClick={() => setSession((current) => updateInlineEdit(current, {quantity: current.draft.quantity + 1}))}>Increment</s-button>
        <s-button onClick={() => setSession((current) => resolveInlineEdit(current, {status: 'saved', version: 'v2'}))}>Save</s-button>
        <s-button onClick={() => setSession((current) => resolveInlineEdit(current, {status: 'conflict', version: 'v3'}))}>Conflict</s-button>
      </s-button-group>
    </s-section>;
  },
};
