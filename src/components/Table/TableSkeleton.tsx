import type {ReactNode} from 'react';
import type {TableColumn} from '../../types';
import {TableRenderer} from './TableRenderer';

export interface TableSkeletonProps<T extends object> {
  columns: readonly TableColumn<T>[];
  rowCount?: number;
  label?: string;
  showActions?: boolean;
  actionsLabel?: ReactNode;
}

/** Table-specific, motion-free skeleton composed from native Polaris primitives. */
export function TableSkeleton<T extends object>({columns, rowCount = 3, label = 'Loading', showActions = false, actionsLabel = 'Actions'}: TableSkeletonProps<T>) {
  const count = Number.isSafeInteger(rowCount) ? Math.min(20, Math.max(1, rowCount)) : 3;
  return <div role="status" aria-label={label}>
    <s-text>{label}</s-text>
    <div aria-hidden="true" inert>
      <TableRenderer
        columns={columns}
        rows={Array.from({length: count}, (_, index) => ({
          id: `skeleton-${index}`,
          selected: false,
          cells: columns.map((column) => ({key: column.key, content: <s-box background="strong" borderRadius="small" blockSize="16px" inlineSize={index % 2 === 0 ? '80%' : '60%'} />})),
          actions: showActions ? <s-box background="strong" borderRadius="small" blockSize="16px" inlineSize="64px" /> : null,
        }))}
        loading={false}
        paginate={false}
        hasPreviousPage={false}
        hasNextPage={false}
        onPreviousPage={() => undefined}
        onNextPage={() => undefined}
        allPageSelected={false}
        somePageSelected={false}
        interactionDisabled
        onSelectPage={() => undefined}
        onSelectRow={() => undefined}
        showActions={showActions}
        actionsLabel={actionsLabel}
      />
    </div>
  </div>;
}
