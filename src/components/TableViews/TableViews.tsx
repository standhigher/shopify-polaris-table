import {useCallback, useEffect, useRef, useState, useSyncExternalStore} from 'react';

import type {TableQuery} from '../../types';
import type {TableView, TableViewManager} from '../../views/tableViews';

export interface TableViewLabels {
  savedView: string;
  noSavedView: string;
  viewName: string;
  createView: string;
  renameView: string;
  saveView: string;
  deleteView: string;
  genericError: string;
  retry?: string;
  reload?: string;
}

export interface TableViewsProps {
  manager: TableViewManager;
  views: readonly TableView[];
  owner: string;
  query: TableQuery;
  visibleColumnKeys: readonly string[];
  selectedViewId?: string;
  labels?: Partial<TableViewLabels>;
  onSelectedViewChange: (view: TableView | undefined) => void;
  onViewsChange: (views: readonly TableView[]) => void;
}

type ViewIntent = {revision: number; manager: TableViewManager; invoke: () => Promise<unknown>; apply: (result: unknown) => void};
function copyQuery(query: TableQuery): TableQuery { return JSON.parse(JSON.stringify(query)) as TableQuery; }
function copyView(view: TableView): TableView { return {...view, query: copyQuery(view.query), visibleColumnKeys: [...view.visibleColumnKeys]}; }

/** Controlled saved-view actions; persistence, authorization and conflict policy remain in the repository. */
export function TableViews(props: TableViewsProps) {
  const {manager, views, owner, query, visibleColumnKeys, selectedViewId, labels = {}} = props;
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<ViewIntent | null>(null);
  const mounted = useRef(true);
  const sequence = useRef(0);
  const active = useRef<number | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const signature = JSON.stringify({owner, selectedViewId, query, visibleColumnKeys, views});
  const scope = useRef({manager, signature, revision: 0});
  if (scope.current.manager !== manager || scope.current.signature !== signature) {
    scope.current = {manager, signature, revision: scope.current.revision + 1};
    active.current = null;
  }
  const revision = scope.current.revision;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; active.current = null; };
  }, []);
  useEffect(() => {
    setPending(false); setError(null); setRetry(null);
  }, [revision]);
  useEffect(() => setName(''), [manager, owner, selectedViewId]);

  const isCurrent = (intent: ViewIntent) => mounted.current && intent.manager === scope.current.manager && intent.revision === scope.current.revision;
  const blocked = () => active.current !== null || latest.current.manager.getState().pending;
  const run = (intent: ViewIntent) => {
    if (blocked() || !isCurrent(intent)) return;
    const operationId = ++sequence.current;
    active.current = operationId;
    setPending(true); setError(null); setRetry(null);
    let persisted = false;
    void Promise.resolve().then(() => {
      if (!isCurrent(intent) || active.current !== operationId) return undefined;
      if (intent.manager.getState().pending) throw new Error('Another saved-view operation is in progress. Retry after it finishes.');
      return intent.invoke();
    }).then((result) => {
      persisted = true;
      if (isCurrent(intent) && active.current === operationId) intent.apply(result);
    }).catch((reason: unknown) => {
      if (!isCurrent(intent) || active.current !== operationId) return;
      setError(reason instanceof Error ? reason.message : latest.current.labels?.genericError ?? 'Could not update saved views.');
      // A host callback failure after persistence must never retry the write.
      if (!persisted) setRetry(intent);
    }).finally(() => {
      if (mounted.current && active.current === operationId) { active.current = null; setPending(false); }
    });
  };
  const makeWrite = (invoke: () => Promise<TableView>, apply: (view: TableView) => void): ViewIntent => {
    let result: TableView | undefined;
    return {revision, manager, invoke: async () => { result = copyView(await invoke()); return result; }, apply: () => { if (result) apply(result); }};
  };
  const reload = () => {
    let result: readonly TableView[] = [];
    run({revision, manager, invoke: async () => { result = await manager.list(); return result; }, apply: () => latest.current.onViewsChange(result.map(copyView))});
  };
  const selectedView = views.find((view) => view.id === selectedViewId);
  const subscribe = useCallback((listener: () => void) => manager.subscribe?.(listener) ?? (() => undefined), [manager]);
  const getPending = useCallback(() => manager.getState().pending, [manager]);
  const managerPending = useSyncExternalStore(subscribe, getPending, getPending);
  const disabled = pending || managerPending;
  const text = {
    savedView: labels.savedView ?? 'Saved view', noSavedView: labels.noSavedView ?? 'No saved view', viewName: labels.viewName ?? 'View name',
    createView: labels.createView ?? 'Create view', renameView: labels.renameView ?? 'Rename view', saveView: labels.saveView ?? 'Save view',
    deleteView: labels.deleteView ?? 'Delete view', retry: labels.retry ?? 'Retry saved view', reload: labels.reload ?? 'Reload views',
  };

  return <s-stack gap="base">
    <s-stack direction="inline" gap="base">
      <s-select label={text.savedView} value={selectedView?.id ?? ''} disabled={disabled} onChange={(event) => {
        if (blocked()) return;
        const value = event.currentTarget.value;
        const next = latest.current.views.find((view) => view.id === value);
        if (value && !next) return;
        latest.current.onSelectedViewChange(next);
      }}>
        <s-option value="" selected={!selectedView}>{text.noSavedView}</s-option>
        {views.map((view) => <s-option key={view.id} value={view.id} selected={view.id === selectedViewId}>{view.name}</s-option>)}
      </s-select>
      <s-text-field label={text.viewName} value={name} autocomplete="off" disabled={disabled} onInput={(event) => { if (!blocked()) setName(event.currentTarget.value); }} />
      <s-button disabled={disabled || !name.trim()} onClick={() => {
        if (blocked() || !name.trim()) return;
        const actionName = name.trim();
        const target = selectedView ? copyView(selectedView) : undefined;
        const capturedQuery = copyQuery(query);
        const capturedColumns = [...visibleColumnKeys];
        run(makeWrite(
          () => target ? manager.rename(target.id, actionName, target.updatedAt) : manager.create({name: actionName, owner, query: capturedQuery, visibleColumnKeys: capturedColumns}),
          (next) => {
            const nextViews = target ? latest.current.views.map((view) => view.id === target.id ? next : view) : [...latest.current.views, next];
            latest.current.onViewsChange(nextViews);
            latest.current.onSelectedViewChange(next);
            setName('');
          },
        ));
      }}>{selectedView ? text.renameView : text.createView}</s-button>
      <s-button disabled={disabled || !selectedView} onClick={() => {
        if (blocked() || !selectedView) return;
        const target = copyView(selectedView);
        const capturedQuery = copyQuery(query);
        const capturedColumns = [...visibleColumnKeys];
        run(makeWrite(
          () => manager.update({id: target.id, query: capturedQuery, visibleColumnKeys: capturedColumns, updatedAt: target.updatedAt}),
          (next) => { latest.current.onViewsChange(latest.current.views.map((view) => view.id === target.id ? next : view)); latest.current.onSelectedViewChange(next); },
        ));
      }}>{text.saveView}</s-button>
      <s-button tone="critical" disabled={disabled || !selectedView} onClick={() => {
        if (blocked() || !selectedView) return;
        const targetId = selectedView.id;
        run({revision, manager, invoke: () => manager.remove(targetId), apply: () => {
          latest.current.onViewsChange(latest.current.views.filter((view) => view.id !== targetId));
          if (latest.current.selectedViewId === targetId) latest.current.onSelectedViewChange(undefined);
        }});
      }}>{text.deleteView}</s-button>
      <s-button variant="secondary" disabled={disabled} onClick={reload}>{text.reload}</s-button>
    </s-stack>
    {error ? <s-banner tone="critical">
      {error}
      {retry && isCurrent(retry) ? <s-button slot="secondary-actions" variant="secondary" disabled={disabled} onClick={() => run(retry)}>{text.retry}</s-button> : null}
    </s-banner> : null}
  </s-stack>;
}
