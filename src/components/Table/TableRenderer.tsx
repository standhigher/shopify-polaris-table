import type {ReactNode} from 'react';
import type {TableColumn, TableColumnAlignment} from '../../types';
import {TableRow} from './TableRow';

export interface TableRenderedCell {
  key: string;
  content: ReactNode;
  align?: TableColumnAlignment;
}

export interface TableRenderedRow {
  id: string;
  selected: boolean;
  cells: readonly TableRenderedCell[];
  actions?: ReactNode;
}

interface TableRendererProps<T extends object> {
  columns: readonly TableColumn<T>[];
  rows: readonly TableRenderedRow[];
  loading: boolean;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  allPageSelected: boolean;
  somePageSelected: boolean;
  interactionDisabled: boolean;
  onSelectPage: (selected: boolean) => void;
  onSelectRow: (id: string, selected: boolean) => void;
  showActions: boolean;
  actionsLabel: ReactNode;
}

/** Presentation only: the host Table owns querying, selection and action execution. */
export function TableRenderer<T extends object>({
  columns, rows, loading, hasPreviousPage, hasNextPage, onPreviousPage, onNextPage,
  allPageSelected, somePageSelected, interactionDisabled, onSelectPage, onSelectRow, showActions, actionsLabel,
}: TableRendererProps<T>) {
  if (new Set(columns.map((column) => column.key)).size !== columns.length) throw new Error('Table columns must have unique keys.');
  if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error('Table rows must have unique IDs.');
  // Duplicate singleton list positions would hide content in Polaris 2.0.
  const occupiedSlots = new Set<string>();
  const listSlots = columns.map((column) => {
    const slot = column.listSlot ?? 'labeled';
    if (slot === 'primary' || slot === 'secondary' || slot === 'kicker') {
      if (occupiedSlots.has(slot)) return 'labeled';
      occupiedSlots.add(slot);
    }
    return slot;
  });
  return <s-table
    variant="auto"
    paginate
    loading={loading}
    hasPreviousPage={hasPreviousPage}
    hasNextPage={hasNextPage}
    onPreviousPage={onPreviousPage}
    onNextPage={onNextPage}
  >
    <s-table-header-row>
      <s-table-header listSlot="inline">
        <s-checkbox label="Select all rows" labelAccessibilityVisibility="exclusive" checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} disabled={interactionDisabled} onChange={(event) => { if (!interactionDisabled) onSelectPage(event.currentTarget.checked); }} />
      </s-table-header>
      {columns.map((column, index) => <s-table-header
        key={column.key}
        listSlot={listSlots[index] ?? 'labeled'}
        format={column.type === 'money' ? 'currency' : column.type === 'number' ? 'numeric' : 'base'}
      >
        {column.align ? <div style={{textAlign: column.align, inlineSize: '100%'}}>{column.title}</div> : column.title}
      </s-table-header>)}
      {showActions ? <s-table-header listSlot="inline">{actionsLabel}</s-table-header> : null}
    </s-table-header-row>
    <s-table-body>
      {rows.map((row) => <TableRow key={row.id} id={row.id} selected={row.selected} disabled={interactionDisabled} onSelectionChange={(selected) => onSelectRow(row.id, selected)} cells={row.cells} actions={showActions ? row.actions : null} />)}
    </s-table-body>
  </s-table>;
}
