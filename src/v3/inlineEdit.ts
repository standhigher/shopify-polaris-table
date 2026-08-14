export type InlineEditVersion = string | number;

export interface InlineEditError {
  field?: string;
  message: string;
}

export interface InlineEditSession<T extends Record<string, unknown>> {
  rowId: string;
  initial: Readonly<T>;
  draft: Readonly<T>;
  version: InlineEditVersion;
  status: 'editing' | 'saving' | 'error' | 'conflict' | 'saved';
  errors: readonly InlineEditError[];
}

export type InlineEditResult =
  | {status: 'saved'; version: InlineEditVersion}
  | {status: 'error'; errors: readonly InlineEditError[]}
  | {status: 'conflict'; version: InlineEditVersion};

export function beginInlineEdit<T extends Record<string, unknown>>(rowId: string, row: T, version: InlineEditVersion): InlineEditSession<T> {
  return {rowId, initial: {...row}, draft: {...row}, version, status: 'editing', errors: []};
}

export function updateInlineEdit<T extends Record<string, unknown>>(session: InlineEditSession<T>, patch: Partial<T>): InlineEditSession<T> {
  return {...session, draft: {...session.draft, ...patch}, status: 'editing', errors: []};
}

export function validateInlineEdit<T extends Record<string, unknown>>(
  session: InlineEditSession<T>,
  validate: (draft: Readonly<T>) => readonly InlineEditError[],
): {session: InlineEditSession<T>; errors: readonly InlineEditError[]} {
  const errors = validate(session.draft);
  return {errors, session: {...session, status: errors.length === 0 ? 'editing' : 'error', errors}};
}

export function markInlineEditSaving<T extends Record<string, unknown>>(session: InlineEditSession<T>): InlineEditSession<T> {
  return {...session, status: 'saving', errors: []};
}

export function resolveInlineEdit<T extends Record<string, unknown>>(session: InlineEditSession<T>, result: InlineEditResult): InlineEditSession<T> {
  switch (result.status) {
    case 'saved':
      return {...session, version: result.version, status: 'saved', errors: []};
    case 'error':
      return {...session, status: 'error', errors: result.errors};
    case 'conflict':
      return {...session, version: result.version, status: 'conflict'};
  }
}

export function cancelInlineEdit<T extends Record<string, unknown>>(_session: InlineEditSession<T>): undefined {
  return undefined;
}

export function isInlineEditVersionCurrent<T extends Record<string, unknown>>(session: InlineEditSession<T>, version: InlineEditVersion): boolean {
  return session.version === version;
}
