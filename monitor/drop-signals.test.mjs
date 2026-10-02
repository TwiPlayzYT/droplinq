import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dropNameFromHeading,
  headlineProduct,
  preferLinkedProducts,
  productsFromBlogCollection,
  productsFromFeedXml,
  productsFromPostHtml,
  queueProduct,
} from './drop-signals.mjs';

const html = `
  <a href="https://www.pokemoncenter.com/product/10-10438-111">Delta Reign Elite Trainer Box</a>
  <a href="https://www.pokemoncenter.com/product/10-10446-120">Delta Reign Booster Box</a>
  <a href="https://www.pokemoncenter.com/product/10-10439-109">Delta Reign Booster Bundle</a>
  <a href="https://www.pokemoncenter.com/product/10-1">Delta Reign Booster Box Case</a>
  <a href="https://www.pokemoncenter.com/product/10-2">Pikachu Plush</a>
`;

test('reads slugless Pokémon Center links and keeps the link text as the product name', () => {
  const products = productsFromPostHtml(html, { releaseType: 'preorder' });
  assert.deepEqual(
    products.map((product) => product.title).sort(),
    [
      'Delta Reign Booster Box',
      'Delta Reign Booster Bundle',
      'Delta Reign Elite Trainer Box',
    ],
  );
  const etb = products.find((product) => product.id === '10-10438-111');
  assert.equal(etb.format, 'etb');
  assert.equal(etb.releaseType, 'preorder');
  assert.equal(etb.url, 'https://www.pokemoncenter.com/product/10-10438-111');
});

test('only recent posts become drop alerts', () => {
  const now = Date.now();
  const products = productsFromBlogCollection(
    {
      items: [
        {
          title: 'Delta Reign Pokémon Center Preorders Are Live',
          publishOn: now - 60 * 60 * 1000,
          body: html,
        },
        {
          title: 'Old drop',
          publishOn: now - 10 * 24 * 60 * 60 * 1000,
          body: '<a href="https://www.pokemoncenter.com/product/99">Ancient Elite Trainer Box</a>',
        },
      ],
    },
    now,
  );
  assert.equal(products.length, 3);
  assert.ok(products.every((product) => product.title.startsWith('Delta Reign')));
});

test('reads product links out of a recent feed entry and ignores an old one', () => {
  const now = Date.parse('2026-09-30T18:00:00.000Z');
  const xml = `
    <item>
      <title>Delta Reign queue</title>
      <pubDate>Wed, 30 Sep 2026 16:00:00 GMT</pubDate>
      <description>&lt;a href="https://www.pokemoncenter.com/product/10-10438-111"&gt;Delta Reign Elite Trainer Box&lt;/a&gt;</description>
    </item>
    <item>
      <title>Old</title>
      <pubDate>Mon, 01 Sep 2026 16:00:00 GMT</pubDate>
      <description>&lt;a href="https://www.pokemoncenter.com/product/99"&gt;Ancient Elite Trainer Box&lt;/a&gt;</description>
    </item>
  `;
  const products = productsFromFeedXml(xml, now);
  assert.equal(products.length, 1);
  assert.equal(products[0].title, 'Delta Reign Elite Trainer Box');
  assert.equal(products[0].id, '10-10438-111');
});

test('keeps other sealed products and skips plush', () => {
  const products = productsFromPostHtml(`
    <a href="https://www.pokemoncenter.com/product/10-10440-120">Delta Reign 3-Pack Blister</a>
    <a href="https://www.pokemoncenter.com/product/10-9">Knock Out Collection Alakazam</a>
    <a href="https://www.pokemoncenter.com/product/10-8">Pikachu Plush</a>
  `);
  assert.deepEqual(
    products.map((product) => product.title).sort(),
    ['Delta Reign 3-Pack Blister', 'Knock Out Collection Alakazam'],
  );
  assert.equal(products.find((product) => product.id === '10-9').format, 'other');
});

test('a drop headline still alerts when the post has no product link', () => {
  const now = Date.parse('2026-09-30T18:00:00.000Z');
  const xml = `
    <item>
      <title>The Pokémon Center Opens Pre-Orders For Delta Reign</title>
      <link>https://www.polygon.com/delta-reign</link>
      <pubDate>Wed, 30 Sep 2026 16:00:00 GMT</pubDate>
    </item>
    <item>
      <title>WoW Forever New Race</title>
      <pubDate>Wed, 30 Sep 2026 16:00:00 GMT</pubDate>
    </item>
  `;
  const products = productsFromFeedXml(xml, now);
  assert.equal(products.length, 1);
  assert.equal(products[0].title, 'The Pokémon Center Opens Pre-Orders For Delta Reign');
  assert.equal(products[0].releaseType, 'preorder');
  assert.equal(products[0].url, 'https://www.polygon.com/delta-reign');
  assert.equal(headlineProduct('Tips on how to not get banned'), null);
});

test('product links win over a headline so the alert names the product', () => {
  const now = Date.parse('2026-09-30T18:00:00.000Z');
  const linked = productsFromFeedXml(
    `
    <item>
      <title>The Pokémon Center Opens Pre-Orders For Delta Reign</title>
      <pubDate>Wed, 30 Sep 2026 16:00:00 GMT</pubDate>
      <description>&lt;a href="https://www.pokemoncenter.com/product/10-10438-111"&gt;Delta Reign Elite Trainer Box&lt;/a&gt;</description>
    </item>
  `,
    now,
  );
  const headline = headlineProduct('The Pokémon Center Opens Pre-Orders For Delta Reign', {
    detectedAt: '2026-09-30T16:00:00.000Z',
  });
  const chosen = preferLinkedProducts([...linked, headline]);
  assert.deepEqual(
    chosen.map((product) => product.id),
    ['10-10438-111'],
  );
});

test('a queue with no product names alerts with the drop name', () => {
  const now = Date.parse('2026-09-30T18:00:00.000Z');
  const xml = `
    <item>
      <title>Delta Reign Pokémon Center queue is live</title>
      <link>https://www.pokemoncenter.com</link>
      <pubDate>Wed, 30 Sep 2026 16:00:00 GMT</pubDate>
    </item>
  `;
  const products = productsFromFeedXml(xml, now);
  assert.equal(products.length, 1);
  assert.equal(products[0].releaseType, 'queue');
  assert.equal(products[0].title, 'Delta Reign queue is live');
  assert.equal(products[0].url, 'https://www.pokemoncenter.com');
  assert.equal(dropNameFromHeading(products[0].title), 'Delta Reign');
  assert.equal(queueProduct('Tips on the queue for checkout'), null);
});

test('product links in the same check skip the queue alert', () => {
  const now = Date.parse('2026-09-30T18:00:00.000Z');
  const linked = productsFromFeedXml(
    `
    <item>
      <title>Delta Reign Pokémon Center queue is live</title>
      <pubDate>Wed, 30 Sep 2026 16:00:00 GMT</pubDate>
      <description>&lt;a href="https://www.pokemoncenter.com/product/10-10438-111"&gt;Delta Reign Elite Trainer Box&lt;/a&gt;</description>
    </item>
  `,
    now,
  );
  const queued = queueProduct('Delta Reign Pokémon Center queue is live', {
    detectedAt: '2026-09-30T16:00:00.000Z',
  });
  const chosen = preferLinkedProducts([...linked, queued]);
  assert.deepEqual(
    chosen.map((product) => product.id),
    ['10-10438-111'],
  );
});
