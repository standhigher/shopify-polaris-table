import {useId, useMemo} from 'react';

import type {TableColumn} from '../../types';
import {sanitizeVisibleColumnKeys} from '../../features/visibleColumns';

export interface TableColumnVisibilityProps<T extends object> {
  columns: readonly TableColumn<T>[];
  visibleColumnKeys: readonly string[] | undefined;
  requiredColumnKeys?: readonly string[];
  onVisibleColumnsChange: (visibleColumnKeys: readonly string[]) => void;
  label?: string;
  resetLabel?: string;
}

/** An accessible, controlled popover for showing and hiding declared table columns. */
export function TableColumnVisibility<T extends object>({
  columns,
  visibleColumnKeys,
  requiredColumnKeys = [],
  onVisibleColumnsChange,
  label = 'Columns',
  resetLabel = 'Reset columns',
}: TableColumnVisibilityProps<T>) {
  const popoverId = useId();
  const allColumnKeys = useMemo(() => columns.map((column) => String(column.key)), [columns]);
  const visibleKeys = useMemo(
    () => sanitizeVisibleColumnKeys(visibleColumnKeys ?? allColumnKeys, columns, requiredColumnKeys),
    [allColumnKeys, columns, requiredColumnKeys, visibleColumnKeys],
  );
  const visibleKeySet = new Set(visibleKeys);
  const requiredKeySet = new Set(sanitizeVisibleColumnKeys(requiredColumnKeys, columns));
  const canReset = visibleKeys.length !== allColumnKeys.length || allColumnKeys.some((key) => !visibleKeySet.has(key));

  const updateVisibleColumns = (nextKeys: readonly string[]) => {
    onVisibleColumnsChange(sanitizeVisibleColumnKeys(nextKeys, columns, requiredColumnKeys));
  };

  return <>
    <s-button commandFor={popoverId}>{label}</s-button>
    <s-popover id={popoverId} inlineSize="280px">
      <s-box padding="base">
        <s-stack gap="base">
          {columns.map((column) => {
            const key = String(column.key);
            const checked = visibleKeySet.has(key);
            const required = requiredKeySet.has(key);
            const isLastVisibleColumn = checked && visibleKeys.length === 1;
            const richTitle = typeof column.title !== 'string';
            return <s-stack key={key} direction="inline" gap="small"><s-checkbox
              label={richTitle ? key : column.title as string}
              labelAccessibilityVisibility={richTitle ? 'exclusive' : 'visible'}
              checked={checked}
              disabled={required || isLastVisibleColumn}
              onChange={(event) => {
                const nextChecked = event.currentTarget.checked;
                updateVisibleColumns(nextChecked ? [...visibleKeys, key] : visibleKeys.filter((visibleKey) => visibleKey !== key));
              }}
            />{richTitle ? <span>{column.title}</span> : null}</s-stack>;
          })}
          <s-button variant="secondary" disabled={!canReset} onClick={() => updateVisibleColumns(allColumnKeys)}>{resetLabel}</s-button>
        </s-stack>
      </s-box>
    </s-popover>
  </>;
}
