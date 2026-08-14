export interface ExpandableRowsState {
  expandedIds: readonly string[];
}

export function isRowExpanded(state: ExpandableRowsState, id: string): boolean {
  return state.expandedIds.includes(id);
}

export function expandRow(state: ExpandableRowsState, id: string): ExpandableRowsState {
  return isRowExpanded(state, id) ? state : {expandedIds: [...state.expandedIds, id]};
}

export function collapseRow(state: ExpandableRowsState, id: string): ExpandableRowsState {
  return {expandedIds: state.expandedIds.filter((expandedId) => expandedId !== id)};
}

export function toggleRowExpanded(state: ExpandableRowsState, id: string): ExpandableRowsState {
  return isRowExpanded(state, id) ? collapseRow(state, id) : expandRow(state, id);
}
