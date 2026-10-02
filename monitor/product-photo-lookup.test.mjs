import assert from 'node:assert/strict';
import test from 'node:test';

import { choosePackshot } from './product-photo-lookup.mjs';

const RESULTS = [
  { productId: 712102, productName: 'Delta Reign Elite Trainer Box' },
  { productId: 712103, productName: 'Delta Reign Elite Trainer Box Case' },
  { productId: 712104, productName: 'Delta Reign Pokemon Center Elite Trainer Box (Exclusive)' },
  { productId: 712094, productName: 'Delta Reign Booster Box' },
  { productId: 712096, productName: 'Delta Reign Booster Box Case' },
  { productId: 712097, productName: 'Delta Reign Booster Bundle' },
  { productId: 712099, productName: 'Delta Reign Booster Pack' },
];

test('uses the Pokémon Center elite trainer box, not the case or the standard box', () => {
  const match = choosePackshot('Delta Reign Elite Trainer Box', RESULTS);
  assert.equal(match.productId, '712104');
});

test('uses the booster box and not the case or the bundle', () => {
  const match = choosePackshot('Delta Reign Booster Box', RESULTS);
  assert.equal(match.productId, '712094');
});

test('uses the booster bundle and not a booster pack', () => {
  const match = choosePackshot('Delta Reign Booster Bundle', RESULTS);
  assert.equal(match.productId, '712097');
});

test('does not attach a packshot when the format is unknown', () => {
  assert.equal(choosePackshot('Pikachu Plush', RESULTS), null);
});
