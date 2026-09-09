import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const readme = read('README.md');
const chineseReadme = read('README.zh-CN.md');
const productsPage = read('website/src/pages/products.tsx');

const products = [
  ['BestTrack', 'besttrack', '86c847e523c1844757e54172a5b86a00'],
  ['BestUpsell', 'bestupsellapp', 'b64612760d17213e5a102b10e67cce07'],
  ['BestFeed AI', 'bestfeed', 'c65b5a1d079567738b77760188054723'],
  ['BestBundle: AI Bundles', 'bestbundle', 'e473a8b398c0562eb1e2cb79ce736fcc'],
] as const;

describe('products-page referral contract', () => {
  it('limits README promotion to the four approved products', () => {
    expect(readme).toContain('## Built by standhigher');
    expect(chineseReadme).toContain('## 由 standhigher 打造');
    expect(readme).toContain('utm_content=standhigher-polaris-data-table');

    for (const [name, slug] of products) {
      expect(readme).toContain(`[${name}](https://apps.shopify.com/${slug}?utm_source=GitHub&utm_medium=social)`);
      expect(chineseReadme).toContain(`[${name}](https://apps.shopify.com/${slug}?utm_source=GitHub&utm_medium=social)`);
    }
  });

  it('renders only approved products with Shopify logos and UTM propagation', () => {
    expect((productsPage.match(/storeUrl: 'https:\/\/apps\.shopify\.com\//g) ?? [])).toHaveLength(products.length);
    expect(productsPage).toContain("destination.searchParams.set('utm_content', utmContent)");

    for (const [name, slug, logoId] of products) {
      expect(productsPage).toContain(`name: '${name}'`);
      expect(productsPage).toContain(`https://apps.shopify.com/${slug}?utm_source=GitHub&utm_medium=social`);
      expect(productsPage).toContain(`listing_images/${logoId}/icon/`);
    }
  });
});
