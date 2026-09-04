import {Banner, EmptyState, Spinner, Text} from '@shopify/polaris';
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
    return onRetry
      ? <Banner tone="critical" action={{content: labels.retry ?? 'Retry', onAction: onRetry}}>{error}</Banner>
      : <Banner tone="critical">{error}</Banner>;
  }
  if (loading && !empty) {
    return <div role="status" aria-label={labels.loading ?? 'Loading'}><Spinner accessibilityLabel={labels.loading ?? 'Loading'} size="small" /><Text as="span">{labels.loading ?? 'Loading…'}</Text></div>;
  }
  if (empty) {
    if (emptyState) return <>{emptyState}</>;
    if (labels.empty) return <>{labels.empty}</>;
    return <EmptyState heading="No results" image="" />;
  }
  return null;
}
