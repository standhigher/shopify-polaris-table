import {IndexTable} from '@shopify/polaris';
import type {ReactNode} from 'react';

export interface TableRowProps {
  id: string;
  position: number;
  selected: boolean;
  onSelectionChange: (selected: boolean) => void;
  cells: readonly ReactNode[];
  actions?: ReactNode;
}

export function TableRow({id, position, selected, onSelectionChange, cells, actions}: TableRowProps) {
  return <IndexTable.Row id={id} position={position} selected={selected} onClick={() => onSelectionChange(!selected)}>
    {cells.map((cell, index) => <IndexTable.Cell key={`${id}-${index}`}>{cell}</IndexTable.Cell>)}
    {actions ? <IndexTable.Cell>{actions}</IndexTable.Cell> : null}
  </IndexTable.Row>;
}
