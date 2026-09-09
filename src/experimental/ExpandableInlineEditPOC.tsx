import {useEffect, useRef, useState} from 'react';

import {
  beginInlineEdit,
  cancelInlineEdit,
  resolveInlineEdit,
  updateInlineEdit,
  validateInlineEdit,
} from '../v3/inlineEdit';
import type {InlineEditError, InlineEditResult, InlineEditSession, InlineEditVersion} from '../v3/inlineEdit';
import {isRowExpanded, toggleRowExpanded} from '../v3/expandable';

/** Internal 0.8 POC only. It is deliberately not exported from the package entrypoint. */
export interface ExpandableInlineEditPOCRow {
  id: string;
  name: string;
  details: string;
  version: InlineEditVersion;
}

export interface ExpandableInlineEditSaveRequest {
  rowId: string;
  draft: Readonly<Pick<ExpandableInlineEditPOCRow, 'name'>>;
  version: InlineEditVersion;
}

export interface ExpandableInlineEditPOCProps {
  /** Canonical data is controlled by the host; this POC never mutates it locally. */
  rows: readonly ExpandableInlineEditPOCRow[];
  expandedIds: readonly string[];
  onExpandedIdsChange: (expandedIds: readonly string[]) => void;
  onSave: (request: ExpandableInlineEditSaveRequest) => Promise<InlineEditResult> | InlineEditResult;
  validate?: (draft: Readonly<Pick<ExpandableInlineEditPOCRow, 'name'>>) => readonly InlineEditError[];
  ariaLabel: string;
}

type EditableRow = Pick<ExpandableInlineEditPOCRow, 'name'>;

const defaultValidate = (draft: Readonly<EditableRow>): readonly InlineEditError[] => (
  draft.name.trim().length === 0 ? [{field: 'name', message: 'Name is required'}] : []
);

/**
 * Proves one expandable detail region and one optimistic, versioned inline field.
 * Persistence, authorization and canonical row updates remain a host responsibility.
 */
export function ExpandableInlineEditPOC({
  rows, expandedIds, onExpandedIdsChange, onSave, validate = defaultValidate, ariaLabel,
}: ExpandableInlineEditPOCProps) {
  const [session, setSession] = useState<InlineEditSession<EditableRow>>();
  const [notice, setNotice] = useState<string>();
  const detailRefs = useRef(new Map<string, HTMLDivElement>());
  const previouslyExpandedIds = useRef<readonly string[]>(expandedIds);

  useEffect(() => {
    const newlyExpandedId = expandedIds.find((id) => !previouslyExpandedIds.current.includes(id));
    previouslyExpandedIds.current = expandedIds;
    if (newlyExpandedId) detailRefs.current.get(newlyExpandedId)?.focus();
  }, [expandedIds]);

  const toggleExpanded = (rowId: string) => {
    onExpandedIdsChange(toggleRowExpanded({expandedIds}, rowId).expandedIds);
  };

  const startEditing = (row: ExpandableInlineEditPOCRow) => {
    setNotice(undefined);
    setSession(beginInlineEdit<EditableRow>(row.id, {name: row.name}, row.version));
  };

  const cancelEditing = () => {
    if (session) cancelInlineEdit(session);
    setSession(undefined);
    setNotice('Changes discarded. The controlled row was not updated.');
  };

  const saveEditing = async () => {
    if (!session) return;

    const checked = validateInlineEdit(session, validate);
    if (checked.errors.length > 0) {
      setSession(checked.session);
      return;
    }

    const savingSession: InlineEditSession<EditableRow> = {...checked.session, status: 'saving', errors: []};
    setSession(savingSession);
    try {
      const result = await onSave({
        rowId: savingSession.rowId,
        draft: savingSession.draft,
        version: savingSession.version,
      });
      if (result.status === 'saved') {
        setSession(undefined);
      } else {
        setSession((current) => current?.rowId === savingSession.rowId ? resolveInlineEdit(current, result) : current);
      }
      setNotice(result.status === 'saved'
        ? 'Save accepted. Awaiting the host to provide the updated controlled row.'
        : result.status === 'conflict'
          ? 'This row changed elsewhere. Refresh or resolve the conflict before retrying.'
          : undefined);
    } catch {
      const result: InlineEditResult = {status: 'error', errors: [{message: 'Save failed. Try again.'}]};
      setSession((current) => current?.rowId === savingSession.rowId ? resolveInlineEdit(current, result) : current);
    }
  };

  return <div role="region" aria-label={ariaLabel}>
    {notice && <p role="status">{notice}</p>}
    <div role="table" aria-label={ariaLabel}>
      {rows.map((row) => {
        const expanded = isRowExpanded({expandedIds}, row.id);
        const editing = session?.rowId === row.id ? session : undefined;
        const detailsId = `${row.id}-details`;
        const nameError = editing?.errors.find((error) => error.field === 'name')?.message;

        return <div key={row.id}>
          <div role="row">
            <button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => toggleExpanded(row.id)}>
              {expanded ? 'Collapse details' : 'Expand details'}
            </button>
            <span role="cell">{row.name}</span>
            <button type="button" onClick={() => startEditing(row)}>Edit name</button>
          </div>
          {expanded && <div
            id={detailsId}
            role="region"
            aria-label={`${row.name} details`}
            tabIndex={-1}
            ref={(element) => {
              if (element) detailRefs.current.set(row.id, element);
              else detailRefs.current.delete(row.id);
            }}
          >
            {row.details}
          </div>}
          {editing ? <div role="group" aria-label={`Edit ${row.name}`}>
            <label htmlFor={`${row.id}-name`}>Name</label>
            <input
              id={`${row.id}-name`}
              value={editing.draft.name}
              aria-invalid={nameError ? 'true' : undefined}
              aria-describedby={nameError ? `${row.id}-name-error` : undefined}
              disabled={editing.status === 'saving'}
              onChange={(event) => setSession((current) => current ? updateInlineEdit(current, {name: event.target.value}) : current)}
            />
            {nameError && <p id={`${row.id}-name-error`} role="alert">{nameError}</p>}
            {editing.status === 'conflict' && <p role="alert">This row changed elsewhere. Reload its latest version before saving.</p>}
            {editing.status === 'error' && !nameError && editing.errors.map((error) => <p key={error.message} role="alert">{error.message}</p>)}
            <button type="button" onClick={() => void saveEditing()} disabled={editing.status === 'saving'}>
              {editing.status === 'saving' ? 'Saving' : 'Save'}
            </button>
            <button type="button" onClick={cancelEditing} disabled={editing.status === 'saving'}>Cancel</button>
          </div> : null}
        </div>;
      })}
    </div>
  </div>;
}
