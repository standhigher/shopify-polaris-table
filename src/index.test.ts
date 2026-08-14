import {describe, expect, it} from 'vitest';

describe('package entry point', () => {
  it('exports the controlled Table component', async () => {
    const packageEntry = await import('./index');

    expect(packageEntry.Table).toBeTypeOf('function');
  });
});
