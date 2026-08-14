import {Banner, EmptyState, Spinner, Text} from '@shopify/polaris';
import type {ReactNode} from 'react';

export interface TableStateProps {
  error?: ReactNode | undefined;
  loading?: boolean | undefined;
  empty?: boolean | undefined;
  emptyState?: ReactNode | undefined;
  onRetry?: (() => void) | undefined;
}

export function TableState({error, loading = false, empty = false, emptyState, onRetry}: TableStateProps) {
  if (error) {
    return onRetry
      ? <Banner tone="critical" action={{content: 'Retry', onAction: onRetry}}>{error}</Banner>
      : <Banner tone="critical">{error}</Banner>;
  }
  if (loading && !empty) {
    return <div role="status" aria-label="Loading"><Spinner accessibilityLabel="Loading" size="small" /><Text as="span">Loading…</Text></div>;
  }
  if (empty) {
    return <>{emptyState ?? <EmptyState heading="No results" image="" />}</>;
  }
  return null;
}
