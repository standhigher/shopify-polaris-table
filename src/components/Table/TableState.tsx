import type {ReactNode} from 'react';
import type {TableLabels} from '../../types';

export interface TableStateProps {
  error?: ReactNode | undefined;
  loading?: boolean | undefined;
  empty?: boolean | undefined;
  emptyState?: ReactNode | undefined;
  onRetry?: (() => void) | undefined;
  labels?: Partial<TableLabels> | undefined;
  hasData?: boolean;
  loadingState?: ReactNode;
}

export function TableState({error, loading = false, empty = false, emptyState, onRetry, labels = {}, hasData = false, loadingState}: TableStateProps) {
  if (error) {
    return <s-banner tone="critical">
      {error}
      {onRetry ? <s-button slot="secondary-actions" variant="secondary" disabled={loading} onClick={() => { if (!loading) onRetry(); }}>{labels.retry ?? 'Retry'}</s-button> : null}
    </s-banner>;
  }
  if (loading && !hasData) {
    if (loadingState !== undefined && loadingState !== null) return <>{loadingState}</>;
    return <div role="status" aria-label={labels.loading ?? 'Loading'}>
      <s-spinner accessibilityLabel={labels.loading ?? 'Loading'} />
      <s-text>{labels.loading ?? 'Loading…'}</s-text>
    </div>;
  }
  if (empty) {
    if (emptyState !== undefined && emptyState !== null) return <>{emptyState}</>;
    if (labels.empty !== undefined && labels.empty !== null) return <>{labels.empty}</>;
    return <s-empty-state heading="No results" />;
  }
  return null;
}
