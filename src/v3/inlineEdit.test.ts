import {describe, expect, it} from 'vitest';
import {
  beginInlineEdit,
  cancelInlineEdit,
  markInlineEditSaving,
  resolveInlineEdit,
  updateInlineEdit,
  validateInlineEdit,
  isInlineEditVersionCurrent,
} from './inlineEdit';

describe('inline edit state', () => {
  it('supports draft updates, validation, save result and cancel', () => {
    const session = beginInlineEdit('row-1', {name: 'Ada', quantity: 1}, 'v1');
    const updated = updateInlineEdit(session, {quantity: 2});
    const checked = validateInlineEdit(updated, (draft) => draft.quantity > 0 ? [] : [{field: 'quantity', message: 'Must be positive'}]);
    expect(checked.errors).toEqual([]);
    expect(markInlineEditSaving(checked.session).status).toBe('saving');
    const saved = resolveInlineEdit(markInlineEditSaving(checked.session), {status: 'saved', version: 'v2'});
    expect(saved.status).toBe('saved');
    expect(saved.version).toBe('v2');
    expect(cancelInlineEdit(saved)).toBeUndefined();
  });

  it('reports validation errors and optimistic version conflicts', () => {
    const session = beginInlineEdit('row-1', {name: ''}, 3);
    const checked = validateInlineEdit(session, () => [{field: 'name', message: 'Required'}]);
    expect(checked.errors).toEqual([{field: 'name', message: 'Required'}]);
    expect(checked.session.status).toBe('error');
    expect(isInlineEditVersionCurrent(session, 3)).toBe(true);
    expect(isInlineEditVersionCurrent(session, 4)).toBe(false);
    expect(resolveInlineEdit(session, {status: 'conflict', version: 4}).status).toBe('conflict');
  });
});
