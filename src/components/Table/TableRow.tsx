import type {ReactNode} from 'react';
import type {TableRenderedCell} from './TableRenderer';

export interface TableRowProps {
  id: string;
  selected: boolean;
  disabled?: boolean;
  onSelectionChange: (selected: boolean) => void;
  cells: readonly TableRenderedCell[];
  actions?: ReactNode;
}

export function TableRow({id, selected, disabled = false, onSelectionChange, cells, actions}: TableRowProps) {
  return <s-table-row>
    <s-table-cell>
      <s-checkbox label={`Select row ${id}`} labelAccessibilityVisibility="exclusive" checked={selected} disabled={disabled} onChange={(event) => { if (!disabled) onSelectionChange(event.currentTarget.checked); }} />
    </s-table-cell>
    {cells.map((cell) => <s-table-cell key={cell.key}>
      <div style={{minInlineSize: 0, overflowWrap: 'anywhere', ...(cell.align ? {textAlign: cell.align, inlineSize: '100%'} : {})}}>{cell.content}</div>
    </s-table-cell>)}
    {actions ? <s-table-cell>{actions}</s-table-cell> : null}
  </s-table-row>;
}
