import assert from 'node:assert/strict';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const {renderFixture} = await import('./dist/spike.js');
const html = renderFixture();
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
assert.match(html, /<s-table\s/);
assert.match(html, /<s-table-header listSlot="primary">Name/);
assert.match(html, /<s-checkbox[^>]*checked=""[^>]*indeterminate=""/);
assert.match(html, /<s-search-field[^>]*value="query"/);
assert.doesNotMatch(html, /<script|polaris-types/);
console.log('PASS React 19 SSR without DOM or runtime injection');
console.log(html);
