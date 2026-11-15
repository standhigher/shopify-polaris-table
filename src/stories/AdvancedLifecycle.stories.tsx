import type {Meta, StoryObj} from '@storybook/react-vite';
import {useMemo, useRef, useState} from 'react';
import {createTableViewManager, Table, TableFilterPresets, TableViews} from '../index';
import type {TableView, TableViewManagerState, TableViewRepository} from '../views/tableViews';
import type {TableColumn, TableQuery, TableSelection} from '../types';

type Row = {id: string; name: string; status: 'active' | 'draft'; quantity: number};
type Mode = 'ready' | 'initial' | 'refresh' | 'empty' | 'error-empty' | 'error-refresh';
type RepositoryMode = 'ok' | 'denied' | 'conflict';
const rows: readonly Row[] = [
  {id: 'item-1', name: 'Canvas tote', status: 'active', quantity: 24},
  {id: 'item-2', name: 'White sneakers', status: 'draft', quantity: 8},
  {id: 'item-3', name: 'Travel mug', status: 'active', quantity: 12},
  {id: 'item-4', name: 'Cotton shirt', status: 'draft', quantity: 0},
];
const initialView: TableView = {id: 'view-all', name: 'All inventory', owner: 'shop-demo', query: {page: 1, pageSize: 2}, visibleColumnKeys: ['name', 'status', 'quantity'], updatedAt: '2026-01-01T00:00:00.000Z'};
const copyView = (view: TableView): TableView => ({...view, query: JSON.parse(JSON.stringify(view.query)) as TableQuery, visibleColumnKeys: [...view.visibleColumnKeys]});
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 100));

function AdvancedLifecycleExample() {
  const [mode, setMode] = useState<Mode>('ready');
  const [repositoryMode, setRepositoryMode] = useState<RepositoryMode>('ok');
  const repositoryModeRef = useRef<RepositoryMode>('ok');
  const [query, setQuery] = useState<TableQuery>({page: 1, pageSize: 2});
  const [selection, setSelection] = useState<TableSelection>({mode: 'explicit', ids: []});
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<readonly string[]>(['name', 'status', 'quantity']);
  const [includeQuantity, setIncludeQuantity] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [views, setViews] = useState<readonly TableView[]>([copyView(initialView)]);
  const [selectedViewId, setSelectedViewId] = useState<string>();
  const [managerState, setManagerState] = useState<TableViewManagerState>({pending: false});
  const records = useRef<readonly TableView[]>([copyView(initialView)]);
  const counter = useRef(0);
  const stamp = () => new Date(Date.now() + ++counter.current).toISOString();
  const [repository] = useState<TableViewRepository>(() => {
    const checkWrite = () => {
      if (repositoryModeRef.current === 'denied') throw new Error('Permission denied: saved views are read-only.');
      if (repositoryModeRef.current === 'conflict') throw new Error('Saved view conflict: reload views before retrying.');
    };
    const uniqueName = (name: string, exceptId?: string) => {
      if (!name.trim()) throw new Error('A saved view name is required.');
      if (records.current.some((view) => view.id !== exceptId && view.name.toLowerCase() === name.trim().toLowerCase())) throw new Error('A saved view with this name already exists.');
    };
    return {
      list: async () => { await delay(); return records.current.map(copyView); },
      create: async (input) => {
        await delay(); checkWrite(); uniqueName(input.name);
        if (input.owner !== 'shop-demo') throw new Error('Permission denied for this owner.');
        const view = copyView({...input, id: `view-${++counter.current}`, name: input.name.trim(), updatedAt: stamp()});
        records.current = [...records.current, view];
        return copyView(view);
      },
      update: async (input) => {
        await delay(); checkWrite();
        const current = records.current.find((view) => view.id === input.id);
        if (!current) throw new Error('This saved view no longer exists. Reload views.');
        if (input.updatedAt !== undefined && input.updatedAt !== current.updatedAt) throw new Error('Saved view conflict: a newer version exists. Reload views.');
        const name = input.name ?? current.name;
        uniqueName(name, current.id);
        const next = copyView({...current, ...input, name: name.trim(), updatedAt: stamp()});
        records.current = records.current.map((view) => view.id === next.id ? next : view);
        return copyView(next);
      },
      remove: async (id) => {
        await delay(); checkWrite();
        if (!records.current.some((view) => view.id === id)) throw new Error('This saved view no longer exists. Reload views.');
        records.current = records.current.filter((view) => view.id !== id);
      },
    };
  });
  const [manager] = useState(() => createTableViewManager(repository, {onStateChange: setManagerState}));
  const columns = useMemo<readonly TableColumn<Row>[]>(() => [
    {key: 'name', title: <strong>Inventory name</strong>, sortable: true, listSlot: 'primary'},
    {key: 'status', title: 'Status', type: 'status', statusTone: {active: 'success', draft: 'warning'}, listSlot: 'inline'},
    ...(includeQuantity ? [{key: 'quantity', title: 'Quantity', type: 'number' as const, sortable: true, align: 'end' as const, listSlot: 'labeled' as const}] : []),
  ], [includeQuantity]);
  const matchingRows = useMemo(() => {
    const search = query.search?.trim().toLowerCase();
    const status = query.filters?.status;
    const matching = rows.filter((row) => (!search || row.name.toLowerCase().includes(search)) && (!status || status.operator !== 'equals' || row.status === status.value));
    const sort = query.sort;
    if (!sort || !['name', 'status', 'quantity'].includes(sort.field)) return matching;
    return [...matching].sort((left, right) => {
      const leftValue = left[sort.field as keyof Row];
      const rightValue = right[sort.field as keyof Row];
      const difference = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue));
      return sort.direction === 'asc' ? difference : -difference;
    });
  }, [query]);
  const pageRows = matchingRows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
  const noRows = mode === 'initial' || mode === 'empty' || mode === 'error-empty';
  const loading = mode === 'initial' || mode === 'refresh';
  const error = mode === 'error-empty' ? 'Could not load inventory.' : mode === 'error-refresh' ? 'Refresh failed. Showing previous inventory.' : undefined;
  const retry = () => { setRetryCount((count) => count + 1); setMode('ready'); };

  return <s-stack gap="base">
    <s-stack direction="inline" gap="small">
      <s-button onClick={() => setMode('ready')}>Ready</s-button>
      <s-button onClick={() => setMode('initial')}>Initial loading</s-button>
      <s-button onClick={() => setMode('refresh')}>Refresh</s-button>
      <s-button onClick={() => setMode('empty')}>Empty</s-button>
      <s-button onClick={() => setMode('error-empty')}>Error without rows</s-button>
      <s-button onClick={() => setMode('error-refresh')}>Refresh error</s-button>
      <s-button onClick={() => setIncludeQuantity((value) => !value)}>Toggle quantity schema</s-button>
      <s-select label="Repository mode" value={repositoryMode} onChange={(event) => {
        const value = event.currentTarget.value;
        if (value !== 'ok' && value !== 'denied' && value !== 'conflict') return;
        repositoryModeRef.current = value; setRepositoryMode(value);
      }}>
        <s-option value="ok">ok</s-option><s-option value="denied">denied</s-option><s-option value="conflict">conflict</s-option>
      </s-select>
    </s-stack>
    <s-text>Retry count: {retryCount}; manager pending: {String(managerState.pending)}</s-text>
    <TableFilterPresets query={query} onQueryChange={setQuery} presets={[
      {id: 'active', label: 'Active preset', filters: {status: {operator: 'equals', value: 'active'}}},
      {id: 'draft', label: 'Draft preset', filters: {status: {operator: 'equals', value: 'draft'}}},
    ]} />
    <TableViews
      manager={manager} views={views} owner="shop-demo" query={query} visibleColumnKeys={visibleColumnKeys}
      {...(selectedViewId ? {selectedViewId} : {})}
      labels={{retry: 'Retry saved view', reload: 'Reload views'}}
      onViewsChange={setViews}
      onSelectedViewChange={(view) => {
        setSelectedViewId(view?.id);
        if (view) { setQuery(copyView(view).query); setVisibleColumnKeys([...view.visibleColumnKeys]); }
      }}
    />
    <Table
      columns={columns} data={noRows ? [] : pageRows} rowId="id" query={query} onQueryChange={setQuery}
      pagination={{total: mode === 'empty' ? 0 : matchingRows.length}} pageSizeOptions={[2, 4]}
      formatOptions={{locale: 'en-US', timeZone: 'UTC'}} selection={selection} onSelectionChange={setSelection}
      visibleColumnKeys={visibleColumnKeys} onVisibleColumnsChange={setVisibleColumnKeys} requiredColumnKeys={['name']}
      filters={[{key: 'status', label: 'Status', type: 'select', operators: ['equals'], options: [{label: 'Active', value: 'active'}, {label: 'Draft', value: 'draft'}]}]}
      loading={loading} {...(error ? {error} : {})} onRetry={retry} labels={{retry: 'Retry inventory', loading: 'Loading inventory'}}
    />
    <pre data-testid="advanced-lifecycle-diagnostics" style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{JSON.stringify({mode, repositoryMode, query, visibleColumnKeys, includeQuantity, selectedViewId, views, retryCount, manager: {pending: managerState.pending, error: managerState.error instanceof Error ? managerState.error.message : managerState.error}, snapshot: noRows ? [] : pageRows}, null, 2)}</pre>
  </s-stack>;
}

const meta = {title: 'Integration features/Advanced Lifecycle', component: AdvancedLifecycleExample, parameters: {docs: {description: {component: 'Controlled P5 states, column schema reconciliation, presets, and saved-view repository lifecycle.'}}}} satisfies Meta<typeof AdvancedLifecycleExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const StatesViewsAndColumns: Story = {args: {}};
