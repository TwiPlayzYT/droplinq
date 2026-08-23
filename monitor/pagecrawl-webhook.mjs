import { createHmac, timingSafeEqual } from 'node:crypto';

import { classifyFormat, extractProducts } from './pokemon-center-source.mjs';

const productFromPayload = (payload) => {
  const url = payload.url ?? payload.page?.url ?? payload.target_url;
  const title = payload.product_title ?? payload.title;
  if (typeof url !== 'string' || typeof title !== 'string') return undefined;

  const match = url.match(/\/en-ca\/product\/([a-zA-Z0-9-]+)\//);
  const format = classifyFormat(title);
  if (!match || !format) return undefined;

  return {
    id: match[1],
    title,
    category: 'Trading Card Game',
    format,
    region: 'ca',
    releaseType: 'new',
    url,
    detectedAt: payload.changed_at ?? new Date().toISOString(),
    tags: ['tcg', format],
    inStock: true,
  };
};

const inferReleaseType = (payload) => {
  const changeText = [
    payload.contents,
    payload.human_difference,
    payload.short_summary,
    payload.ai_summary,
    payload.markdown_difference,
  ]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  if (changeText.includes('preorder') || changeText.includes('pre-order')) return 'preorder';
  if (
    changeText.includes('back in stock') ||
    changeText.includes('restock') ||
    changeText.includes('available now')
  ) {
    return 'restock';
  }
  return 'new';
};

export function verifyPageCrawlSignature({ rawBody, signature, timestamp, secret }) {
  if (!secret || !signature || !timestamp) return false;
  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60_000) {
    return false;
  }

  const expected = `sha256=${createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')}`;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export function productsFromPageCrawl(payload) {
  const releaseType = inferReleaseType(payload);
  const content = [
    payload.contents,
    payload.html_difference,
    payload.markdown_difference,
    payload.original,
  ]
    .filter((value) => typeof value === 'string')
    .join('\n');

  const extracted = extractProducts(content);
  const directProduct = productFromPayload(payload);
  if (directProduct) extracted.push(directProduct);

  return [...new Map(extracted.map((product) => [product.id, product])).values()].map((product) => ({
    ...product,
    releaseType,
    detectedAt: payload.changed_at ?? new Date().toISOString(),
  }));
}
