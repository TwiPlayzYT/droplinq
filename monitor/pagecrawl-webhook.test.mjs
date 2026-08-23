import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import {
  productsFromPageCrawl,
  verifyPageCrawlSignature,
} from './pagecrawl-webhook.mjs';

test('verifies signed PageCrawl deliveries', () => {
  const secret = 'test-secret';
  const rawBody = '{"id":42}';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')}`;

  assert.equal(
    verifyPageCrawlSignature({ rawBody, signature, timestamp, secret }),
    true,
  );
  assert.equal(
    verifyPageCrawlSignature({ rawBody: `${rawBody} `, signature, timestamp, secret }),
    false,
  );
});

test('converts a stock change webhook into a filtered product event', () => {
  const products = productsFromPageCrawl({
    id: 42,
    title: 'Pokémon TCG: 151 Ultra-Premium Collection',
    url: 'https://www.pokemoncenter.com/en-ca/product/100-10003/pokemon-151-upc',
    human_difference: 'This product is back in stock and available now.',
    changed_at: '2026-07-16T20:00:00.000Z',
  });

  assert.equal(products.length, 1);
  assert.equal(products[0].format, 'upc');
  assert.equal(products[0].releaseType, 'restock');
});
