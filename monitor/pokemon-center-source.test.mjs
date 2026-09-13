import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyFormat, extractProducts } from './pokemon-center-source.mjs';

test('classifies only supported sealed TCG formats', () => {
  assert.equal(classifyFormat('Pokémon Center Elite Trainer Box'), 'etb');
  assert.equal(classifyFormat('Journey Together Booster Bundle'), 'booster-bundle');
  assert.equal(classifyFormat('Surging Sparks Booster Box'), 'booster-box');
  assert.equal(classifyFormat('Surging Sparks Booster Display'), 'booster-box');
  assert.equal(classifyFormat('151 Ultra-Premium Collection'), 'upc');
  assert.equal(classifyFormat('Pikachu Plush'), undefined);
});

test('extracts and deduplicates product links across storefronts', () => {
  const html = `
    <a href="/en-ca/product/100-10001/prismatic-evolutions-elite-trainer-box">ETB</a>
    <a href="\\/en-ca\\/product\\/100-10002\\/journey-together-booster-bundle">Bundle</a>
    <a href="/en-ca/product/100-10001/prismatic-evolutions-elite-trainer-box">Duplicate</a>
    <a href="/product/100-10003/surging-sparks-elite-trainer-box">US ETB</a>
    <a href="/en-ca/product/100-10004/pikachu-plush">Ignored plush</a>
  `;

  const products = extractProducts(html);
  assert.equal(products.length, 3);
  assert.deepEqual(
    products.map((product) => product.format).sort(),
    ['booster-bundle', 'etb', 'etb'],
  );
  assert.ok(products.some((product) => product.region === 'ca' && product.url.includes('/en-ca/product/')));
  assert.ok(products.some((product) => product.region === 'us' && product.url.includes('/product/')));
});
