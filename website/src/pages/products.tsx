import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import {useEffect, useState} from 'react';

type Product = {
  name: string;
  description: {en: string; zh: string};
  logoUrl: string;
  storeUrl: string;
};

const products: readonly Product[] = [
  {
    name: 'BestTrack',
    description: {
      en: 'Branded order tracking and proactive delivery updates.',
      zh: '品牌化订单追踪和主动送达通知。',
    },
    logoUrl: 'https://cdn.shopify.com/app-store/listing_images/86c847e523c1844757e54172a5b86a00/icon/CMeD-quJrJYDEAE=.png',
    storeUrl: 'https://apps.shopify.com/besttrack?utm_source=GitHub&utm_medium=social',
  },
  {
    name: 'BestUpsell',
    description: {
      en: 'Upsells, bundles, cart offers, and post-purchase deals.',
      zh: '加购推荐、组合销售、购物车优惠和购后优惠。',
    },
    logoUrl: 'https://cdn.shopify.com/app-store/listing_images/b64612760d17213e5a102b10e67cce07/icon/CL-Dp6X4zJYDEAE=.png',
    storeUrl: 'https://apps.shopify.com/bestupsellapp?utm_source=GitHub&utm_medium=social',
  },
  {
    name: 'BestFeed AI',
    description: {
      en: 'Product optimization for AI search experiences.',
      zh: '面向 AI 搜索体验的商品内容优化。',
    },
    logoUrl: 'https://cdn.shopify.com/app-store/listing_images/c65b5a1d079567738b77760188054723/icon/CNGtw4n1x5UDEAE=.png',
    storeUrl: 'https://apps.shopify.com/bestfeed?utm_source=GitHub&utm_medium=social',
  },
  {
    name: 'BestBundle: AI Bundles',
    description: {
      en: 'AI-assisted bundles, gifts, and offer performance tracking.',
      zh: 'AI 辅助组合、赠品与优惠效果追踪。',
    },
    logoUrl: 'https://cdn.shopify.com/app-store/listing_images/e473a8b398c0562eb1e2cb79ce736fcc/icon/CKG15KC5h5YDEAE=.png',
    storeUrl: 'https://apps.shopify.com/bestbundle?utm_source=GitHub&utm_medium=social',
  },
];

function withUtmContent(storeUrl: string, utmContent: string | undefined) {
  if (!utmContent || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(utmContent)) return storeUrl;
  const destination = new URL(storeUrl);
  destination.searchParams.set('utm_content', utmContent);
  return destination.toString();
}

export default function ProductsPage() {
  const {i18n} = useDocusaurusContext();
  const isChinese = i18n.currentLocale === 'zh-CN';
  const [utmContent, setUtmContent] = useState<string>();

  useEffect(() => {
    setUtmContent(new URLSearchParams(window.location.search).get('utm_content') ?? undefined);
  }, []);

  const title = isChinese ? 'standhigher 产品' : 'standhigher Products';
  const description = isChinese
    ? '为 Shopify 商家提供增长、订单体验和商品优化工具。'
    : 'Tools for Shopify merchants to improve growth, order experiences, and product optimization.';
  const buttonText = isChinese ? '在 Shopify 查看' : 'View on Shopify';

  return <Layout title={title} description={description}>
    <main className="products-page">
      <section className="products-hero">
        <p className="products-eyebrow">Built by standhigher</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="products-grid" aria-label={title}>
        {products.map((product) => <article className="product-card" key={product.name}>
          <div className="product-heading">
            <img alt={`${product.name} logo`} className="product-logo" height="64" src={product.logoUrl} width="64" />
            <h2>{product.name}</h2>
          </div>
          <p>{isChinese ? product.description.zh : product.description.en}</p>
          <a className="product-cta" data-product={product.name} href={withUtmContent(product.storeUrl, utmContent)} rel="noreferrer" target="_blank">
            {buttonText}
          </a>
        </article>)}
      </section>
    </main>
  </Layout>;
}
