import assert from 'node:assert/strict';
import test from 'node:test';

import { productsFromBlogCollection, productsFromPostHtml } from './drop-signals.mjs';

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
