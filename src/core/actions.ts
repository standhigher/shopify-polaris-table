export interface CoreExplicitSelection {
  mode: 'explicit';
  ids: readonly string[];
}

export interface CoreAllMatchingSelection {
  mode: 'allMatching';
  selectionToken: string;
  selectedCount: number;
  expiresAt: string;
  excludedIds: readonly string[];
}

export type CoreSelection = CoreExplicitSelection | CoreAllMatchingSelection;

export type CoreBulkActionResult =
  | {status: 'completed'; succeededCount: number; failed: readonly unknown[]; clearSelection: boolean}
  | {status: 'accepted'; operationId: string; acceptedCount: number; clearSelection: boolean};

export function createIdempotencyKey(): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject?.randomUUID) return cryptoObject.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function isSelectionExpired(selection: CoreSelection, now: Date | number = new Date()): boolean {
  if (selection.mode !== 'allMatching') return false;
  const timestamp = now instanceof Date ? now.getTime() : now;
  return Date.parse(selection.expiresAt) <= timestamp;
}

export function shouldClearSelection(result: CoreBulkActionResult): boolean {
  return result.clearSelection === true;
}
