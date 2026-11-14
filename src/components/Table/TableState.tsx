import type {ReactNode} from 'react';
import type {TableLabels} from '../../types';

export interface TableStateProps {
  error?: ReactNode | undefined;
  loading?: boolean | undefined;
  empty?: boolean | undefined;
  emptyState?: ReactNode | undefined;
  onRetry?: (() => void) | undefined;
  labels?: Partial<TableLabels> | undefined;
}

export function TableState({error, loading = false, empty = false, emptyState, onRetry, labels = {}}: TableStateProps) {
  if (error) {
    return <s-banner tone="critical">
      {error}
      {onRetry ? <s-button slot="secondary-actions" variant="secondary" onClick={onRetry}>{labels.retry ?? 'Retry'}</s-button> : null}
    </s-banner>;
  }
  if (loading && !empty) {
    return <div role="status" aria-label={labels.loading ?? 'Loading'}>
      <s-spinner accessibilityLabel={labels.loading ?? 'Loading'} />
      <s-text>{labels.loading ?? 'Loading…'}</s-text>
    </div>;
  }
  if (empty) {
    if (emptyState) return <>{emptyState}</>;
    if (labels.empty) return <>{labels.empty}</>;
    return <s-heading>No results</s-heading>;
  }
  return null;
}
