import {useState} from 'react';

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

/** Controlled saved-view actions; persistence, authorization, and conflict policy remain in the repository. */
export function TableViews({
  manager, views, owner, query, visibleColumnKeys, selectedViewId, labels = {}, onSelectedViewChange, onViewsChange,
}: TableViewsProps) {
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const selectedView = views.find((view) => view.id === selectedViewId);
  const text: TableViewLabels = {
    savedView: labels.savedView ?? 'Saved view', noSavedView: labels.noSavedView ?? 'No saved view', viewName: labels.viewName ?? 'View name',
    createView: labels.createView ?? 'Create view', renameView: labels.renameView ?? 'Rename view', saveView: labels.saveView ?? 'Save view',
    deleteView: labels.deleteView ?? 'Delete view', genericError: labels.genericError ?? 'Could not update saved views.',
  };

  const run = async (operation: () => Promise<void>) => {
    setPending(true);
    setError(undefined);
    try { await operation(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : text.genericError); }
    finally { setPending(false); }
  };

  return <s-stack gap="base">
    <s-stack direction="inline" gap="base">
      <s-select label={text.savedView} value={selectedViewId ?? ''} disabled={pending} onChange={(event) => {
        const id = event.currentTarget.value;
        onSelectedViewChange(views.find((view) => view.id === id));
      }}>
        <s-option value="" selected={!selectedViewId}>{text.noSavedView}</s-option>
        {views.map((view) => <s-option key={view.id} value={view.id} selected={view.id === selectedViewId}>{view.name}</s-option>)}
      </s-select>
      <s-text-field label={text.viewName} value={name} autocomplete="off" disabled={pending} onInput={(event) => setName(event.currentTarget.value)} />
      <s-button disabled={pending || name.trim().length === 0} onClick={() => void run(async () => {
        const next = selectedView
          ? await manager.rename(selectedView.id, name.trim(), selectedView.updatedAt)
          : await manager.create({name: name.trim(), owner, query, visibleColumnKeys});
        const nextViews = selectedView ? views.map((view) => view.id === next.id ? next : view) : [...views, next];
        onViewsChange(nextViews);
        onSelectedViewChange(next);
        setName('');
      })}>{selectedView ? text.renameView : text.createView}</s-button>
      <s-button disabled={pending || !selectedView} onClick={() => void run(async () => {
        if (!selectedView) return;
        const next = await manager.update({id: selectedView.id, query, visibleColumnKeys, updatedAt: selectedView.updatedAt});
        onViewsChange(views.map((view) => view.id === next.id ? next : view));
        onSelectedViewChange(next);
      })}>{text.saveView}</s-button>
      <s-button tone="critical" disabled={pending || !selectedView} onClick={() => void run(async () => {
        if (!selectedView) return;
        await manager.remove(selectedView.id);
        onViewsChange(views.filter((view) => view.id !== selectedView.id));
        onSelectedViewChange(undefined);
      })}>{text.deleteView}</s-button>
    </s-stack>
    {error ? <s-banner tone="critical">{error}</s-banner> : null}
  </s-stack>;
}
