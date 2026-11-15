import {useEffect, useId, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {createIdempotencyKey, isSelectionExpired} from '../../core';
import {getSelectionCount} from '../../features/selection';
import {copyTableSelection} from '../../hooks/useTableSelection';
import type {TableSelectionContext} from '../../hooks/useTableSelection';
import type {TableBulkAction, TableBulkActionResult} from '../../types';

export interface TableBulkActionsProps {
  actions: readonly TableBulkAction[];
  selectedCount: number;
  loading: boolean;
  capture: () => TableSelectionContext;
  isCurrent: (context: TableSelectionContext) => boolean;
  clearIfCurrent: (context: TableSelectionContext) => void;
  selectFailed: (ids: readonly string[]) => void;
  onClear: () => void;
}

type IntentStatus = 'ready' | 'running' | 'completed' | 'partial' | 'accepted' | 'rejected';
interface BulkIntent {
  action: TableBulkAction;
  context: TableSelectionContext;
  idempotencyKey: string;
  status: IntentStatus;
}
interface Confirmation {
  action: TableBulkAction;
  context: TableSelectionContext;
}
interface Feedback {
  intent?: BulkIntent;
  result?: TableBulkActionResult;
  error?: string;
  expired?: boolean;
}

function sameContext(left: TableSelectionContext, right: TableSelectionContext): boolean {
  return left.criteriaKey === right.criteriaKey && left.criteriaRevision === right.criteriaRevision && left.selectionRevision === right.selectionRevision;
}
function terminal(intent: BulkIntent): boolean {
  return intent.status === 'completed' || intent.status === 'partial' || intent.status === 'accepted';
}
function selectionExpiredError(reason: unknown): boolean {
  return typeof reason === 'object' && reason !== null && 'code' in reason && reason.code === 'SELECTION_EXPIRED';
}

/** Business toolbar: no requests, persistence or automatic polling/retries. */
export function TableBulkActions(props: TableBulkActionsProps) {
  const {actions, selectedCount, loading, capture, isCurrent, selectFailed, onClear} = props;
  const id = useId();
  const modalRef = useRef<HTMLElementTagNameMap['s-modal']>(null);
  const mounted = useRef(true);
  const lock = useRef<BulkIntent | null>(null);
  const intents = useRef(new Map<string, BulkIntent>());
  const latest = useRef(props);
  latest.current = props;
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const usable = (context: TableSelectionContext): boolean => {
    const current = latest.current;
    if (!mounted.current || current.loading || !current.isCurrent(context)) return false;
    if (isSelectionExpired(context.selection)) {
      current.clearIfCurrent(context);
      setFeedback({expired: true, error: 'Selection has expired. Select the rows again.'});
      return false;
    }
    if (!context.usable || !current.capture().usable) return false;
    return getSelectionCount(context.selection) > 0;
  };

  const execute = async (intent: BulkIntent) => {
    if (lock.current || terminal(intent) || !usable(intent.context)) return;
    lock.current = intent;
    intent.status = 'running';
    setPending(true);
    setFeedback({intent});
    try {
      const result = await Promise.resolve().then(() => {
        if (!mounted.current) throw new Error('Operation cancelled before submission.');
        if (isSelectionExpired(intent.context.selection)) throw Object.assign(new Error('Selection has expired. Select the rows again.'), {code: 'SELECTION_EXPIRED'});
        return intent.action.perform({
          actionId: intent.action.id,
          selection: copyTableSelection(intent.context.selection),
          idempotencyKey: intent.idempotencyKey,
        });
      });
      intent.status = result.status === 'accepted' ? 'accepted' : result.failed.length > 0 ? 'partial' : 'completed';
      if (!mounted.current) return;
      setFeedback({intent, result});
      if (result.clearSelection) latest.current.clearIfCurrent(intent.context);
      modalRef.current?.hideOverlay?.();
      setConfirmation(null);
    } catch (reason) {
      intent.status = 'rejected';
      if (!mounted.current) return;
      const expired = selectionExpiredError(reason);
      if (expired) latest.current.clearIfCurrent(intent.context);
      setFeedback({intent, error: reason instanceof Error ? reason.message : expired ? 'Selection has expired. Select the rows again.' : 'Bulk action failed', expired});
    } finally {
      if (lock.current === intent) {
        lock.current = null;
        if (mounted.current) {
          setPending(false);
          if (!latest.current.isCurrent(intent.context) && intent.status === 'rejected') setConfirmation(null);
          // A successful clearSelection legitimately changes the revision, so
          // keep settled feedback; only discard an unfinished stale display.
          setFeedback((current) => current?.intent === intent && !current.result && !current.error && !latest.current.isCurrent(intent.context) ? null : current);
        }
      }
    }
  };

  const start = (action: TableBulkAction, context: TableSelectionContext) => {
    if (lock.current || !usable(context)) return;
    let intent = intents.current.get(action.id);
    if (!intent || !sameContext(intent.context, context)) {
      intent = {action, context, idempotencyKey: createIdempotencyKey(), status: 'ready'};
      intents.current.set(action.id, intent);
    }
    void execute(intent);
  };
  const choose = (action: TableBulkAction) => {
    if (lock.current || loading) return;
    const context = capture();
    if (!usable(context)) return;
    if (action.destructive) setConfirmation({action, context});
    else start(action, context);
  };
  const blocked = (action: TableBulkAction): boolean => {
    const previous = intents.current.get(action.id);
    return loading || pending || Boolean(previous && isCurrent(previous.context) && terminal(previous));
  };
  const renderAction = (action: TableBulkAction) => <s-button
    key={action.id}
    {...(action.destructive ? {tone: 'critical' as const, commandFor: id, command: '--show' as const} : {})}
    disabled={blocked(action)}
    loading={pending && lock.current?.action.id === action.id}
    onClick={() => choose(action)}
  >{action.content}</s-button>;

  let resultFeedback: ReactNode = null;
  if (feedback) {
    const {result, error, intent, expired} = feedback;
    const current = intent ? isCurrent(intent.context) : false;
    if (error) resultFeedback = <s-banner tone={expired ? 'warning' : 'critical'}>
      <span>{error}</span>
      {intent && !expired ? <s-button slot="secondary-actions" variant="secondary" disabled={loading || pending || !current} onClick={() => { void execute(intent); }}>Retry same operation</s-button> : null}
    </s-banner>;
    else if (result?.status === 'accepted') resultFeedback = <s-banner tone="info">{`Operation ${result.operationId} accepted (${result.acceptedCount}). Processing is not yet complete.`}</s-banner>;
    else if (result?.status === 'completed') resultFeedback = <s-banner tone={result.failed.length ? 'warning' : 'success'}>
      <span>{`${result.succeededCount} succeeded, ${result.failed.length} failed`}</span>
      {result.failed.length > 0 ? <>
        <ul>{result.failed.map((failure, index) => <li key={`${failure.id}-${index}`}>{`${failure.id}: ${failure.reason}`}</li>)}</ul>
        <s-button slot="secondary-actions" variant="secondary" disabled={loading || pending || !current} onClick={() => { if (intent && latest.current.isCurrent(intent.context)) selectFailed(result.failed.map((failure) => failure.id)); }}>Select failed rows</s-button>
      </> : null}
    </s-banner>;
    else if (pending) resultFeedback = <div role="status">Bulk action in progress…</div>;
  }

  return <>
    {selectedCount > 0 && actions.length > 0 ? <s-stack direction="inline" gap="small">
      <s-text>{`${selectedCount} selected`}</s-text>
      {actions[0] ? renderAction(actions[0]) : null}
      {actions.length > 1 ? <>
        <s-button commandFor={`${id}-menu`} disabled={loading || pending}>More actions</s-button>
        <s-menu id={`${id}-menu`} accessibilityLabel="Bulk actions">{actions.slice(1).map(renderAction)}</s-menu>
      </> : null}
      <s-button variant="tertiary" disabled={loading || pending} onClick={onClear}>Clear selection</s-button>
    </s-stack> : null}
    {resultFeedback}
    <s-modal ref={modalRef} id={id} heading="Confirm bulk action" onAfterHide={() => setConfirmation(null)}>
      <s-paragraph>{`Apply this action to ${confirmation ? getSelectionCount(confirmation.context.selection) : 0} selected rows?`}</s-paragraph>
      <div>{confirmation?.action.content}</div>
      <s-button slot="secondary-actions" variant="secondary" commandFor={id} command="--hide" disabled={pending} onClick={() => setConfirmation(null)}>Cancel</s-button>
      <s-button slot="primary-action" variant="primary" tone="critical" loading={pending} disabled={loading || pending || !confirmation || !isCurrent(confirmation.context)} onClick={() => { if (confirmation) start(confirmation.action, confirmation.context); }}>Confirm</s-button>
    </s-modal>
  </>;
}
