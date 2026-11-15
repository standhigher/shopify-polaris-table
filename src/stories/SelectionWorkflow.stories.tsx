import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useRef, useState} from 'react';
import {Table} from '../index';
import type {TableBulkAction, TableBulkActionResult, TableQuery, TableSelection} from '../types';

type Row = {id: string; name: string; quantity: number};
const rows: readonly Row[] = Array.from({length: 30}, (_, index) => ({id: `row-${index + 1}`, name: `Inventory item ${String(index + 1).padStart(2, '0')}`, quantity: (index * 13) % 100}));
type ResultMode = 'completed' | 'partial' | 'accepted' | 'reject-once' | 'expired';
const formatOptions = {locale: 'en-US', timeZone: 'UTC'};

function SelectionWorkflowExample() {
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 10});
  const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: []});
  const [resultMode, setResultMode] = useState<ResultMode>('completed');
  const [log, setLog] = useState<readonly string[]>([]);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState('No bulk action has run.');
  const tokenCounter = useRef(0);
  const seenKeys = useRef(new Set<string>());

  const matchingRows = useMemo(() => {
    const search = query.search?.trim().toLowerCase();
    const matched = search ? rows.filter((row) => row.name.toLowerCase().includes(search) || row.id.includes(search)) : [...rows];
    if (!query.sort) return matched;
    return [...matched].sort((left, right) => {
      const leftValue = left[query.sort!.field as keyof Row];
      const rightValue = right[query.sort!.field as keyof Row];
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), undefined, {numeric: true});
      return query.sort!.direction === 'asc' ? comparison : -comparison;
    });
  }, [query]);
  const pageStart = (query.page - 1) * query.pageSize;
  const pageRows = matchingRows.slice(pageStart, pageStart + query.pageSize);
  const selectionCount = selection.mode === 'allMatching' ? selection.selectedCount - selection.excludedIds.length : selection.ids.length;
  const appendLog = (entry: string) => setLog((current) => [...current.slice(-9), entry]);

  const onSelectAllMatching = async (currentQuery: TableQuery) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const count = rows.filter((row) => {
      const search = currentQuery.search?.trim().toLowerCase();
      return !search || row.name.toLowerCase().includes(search) || row.id.includes(search);
    }).length;
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    setTokenExpiresAt(expiresAt);
    return {selectionToken: `token-${++tokenCounter.current}-${Date.now()}`, normalizedQuery: currentQuery, selectedCount: count, expiresAt};
  };

  const bulkActions = useMemo<readonly TableBulkAction[]>(() => {
    const createAction = (id: string, destructive = false): TableBulkAction => ({
      id, content: `${id[0]!.toUpperCase()}${id.slice(1)} selected`, ...(destructive ? {destructive: true} : {}),
      perform: async ({selection: captured, idempotencyKey}): Promise<TableBulkActionResult> => {
        const capturedCount = captured.mode === 'explicit' ? captured.ids.length : captured.selectedCount - captured.excludedIds.length;
        await new Promise((resolve) => setTimeout(resolve, 150));
        appendLog(JSON.stringify({actionId: id, selection: captured, idempotencyKey}));
        if (resultMode === 'reject-once') {
          if (!seenKeys.current.has(idempotencyKey)) {
            seenKeys.current.add(idempotencyKey);
            throw new Error(`Reject once for ${id}`);
          }
        }
        if (resultMode === 'expired') {
          const error = {code: 'SELECTION_EXPIRED'};
          throw error;
        }
        if (resultMode === 'partial') return {status: 'completed', succeededCount: Math.max(0, capturedCount - 1), failed: [{id: captured.mode === 'explicit' ? (captured.ids[0] ?? 'row-1') : 'row-1', reason: 'Locked'}], clearSelection: false};
        if (resultMode === 'accepted') return {status: 'accepted', operationId: `operation-${Date.now()}`, acceptedCount: capturedCount, clearSelection: false};
        return {status: 'completed', succeededCount: capturedCount, failed: [], clearSelection: true};
      },
    });
    return [createAction('archive'), createAction('delete', true), createAction('export')];
  }, [resultMode, selectionCount, log]);

  return <>
    <s-stack direction="inline" gap="small">
      <s-button onClick={() => setSelection({mode: 'explicit', ids: []})}>Reset selection</s-button>
      <s-button onClick={() => {
        const expiresAt = new Date(Date.now() + 500).toISOString();
        setTokenExpiresAt(expiresAt);
        if (selection.mode === 'allMatching') setSelection({...selection, expiresAt});
      }}>Expire token</s-button>
      <s-button onClick={() => setSelection({mode: 'explicit', ids: ['row-30']})}>Replace with row-30</s-button>
      <s-select label="Mock result mode" value={resultMode} onChange={(event) => setResultMode(event.currentTarget.value as ResultMode)}>
        {(['completed', 'partial', 'accepted', 'reject-once', 'expired'] as const).map((mode) => <s-option key={mode} value={mode}>{mode}</s-option>)}
      </s-select>
    </s-stack>
    <s-paragraph>{lastResult}</s-paragraph>
    <Table
      columns={[{key: 'name', title: 'Name', sortable: true, listSlot: 'primary'}, {key: 'quantity', title: 'Quantity', type: 'number', sortable: true, listSlot: 'labeled'}]}
      data={pageRows}
      rowId="id"
      query={query}
      pagination={{total: matchingRows.length}}
      pageSizeOptions={[10, 25, 50]}
      formatOptions={formatOptions}
      filters={[]}
      selection={selection}
      onSelectionChange={(next) => { setSelection(next); setLastResult(`Selection changed: ${JSON.stringify(next)}`); }}
      onSelectAllMatching={onSelectAllMatching}
      bulkActions={bulkActions}
      onQueryChange={setQuery}
    />
    <s-section>
      <s-heading>Selection workflow diagnostics</s-heading>
      <s-text>Selected: {selectionCount}; matching: {matchingRows.length}; token expiry: {tokenExpiresAt ?? 'none'}</s-text>
      <pre data-testid="selection-workflow-log" style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{JSON.stringify({query, selection, log, resultMode}, null, 2)}</pre>
    </s-section>
  </>;
}

const meta = {title: 'Integration features/Selection Workflow', component: SelectionWorkflowExample, parameters: {docs: {description: {component: 'Controlled cross-page selection and bulk-action lifecycle fixture.'}}}} satisfies Meta<typeof SelectionWorkflowExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CrossPageAndBulk: Story = {args: {}};
