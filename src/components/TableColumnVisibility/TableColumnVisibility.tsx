import {BlockStack, Button, Checkbox, Popover} from '@shopify/polaris';
import {useId, useMemo, useState} from 'react';

import type {TableColumn} from '../../types';
import {sanitizeVisibleColumnKeys} from '../../features/visibleColumns';

export interface TableColumnVisibilityProps<T extends object> {
  columns: readonly TableColumn<T>[];
  visibleColumnKeys: readonly string[] | undefined;
  requiredColumnKeys?: readonly string[];
  onVisibleColumnsChange: (visibleColumnKeys: readonly string[]) => void;
  label?: string;
}

/** An accessible, controlled popover for showing and hiding declared table columns. */
export function TableColumnVisibility<T extends object>({
  columns,
  visibleColumnKeys,
  requiredColumnKeys = [],
  onVisibleColumnsChange,
  label = 'Columns',
}: TableColumnVisibilityProps<T>) {
  const [active, setActive] = useState(false);
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

  const activator = (
    <Button
      ariaControls={popoverId}
      ariaExpanded={active}
      onClick={() => setActive((current) => !current)}
    >
      {label}
    </Button>
  );

  return (
    <Popover active={active} activator={activator} onClose={() => setActive(false)}>
      <div id={popoverId}>
        <Popover.Section>
          <BlockStack gap="200">
            {columns.map((column) => {
              const key = String(column.key);
              const checked = visibleKeySet.has(key);
              const required = requiredKeySet.has(key);
              const isLastVisibleColumn = checked && visibleKeys.length === 1;

              return (
                <Checkbox
                  key={key}
                  label={column.title}
                  checked={checked}
                  disabled={required || isLastVisibleColumn}
                  onChange={(nextChecked) => {
                    updateVisibleColumns(nextChecked ? [...visibleKeys, key] : visibleKeys.filter((visibleKey) => visibleKey !== key));
                  }}
                />
              );
            })}
            <Button
              variant="plain"
              disabled={!canReset}
              onClick={() => updateVisibleColumns(allColumnKeys)}
            >
              Reset columns
            </Button>
          </BlockStack>
        </Popover.Section>
      </div>
    </Popover>
  );
}
