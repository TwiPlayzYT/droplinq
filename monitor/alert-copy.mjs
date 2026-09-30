/** Lock-screen text. The product name is the title so a drop says what went live. */
export function alertCopy(product) {
  const name = typeof product?.title === 'string' && product.title.trim()
    ? product.title.trim()
    : 'Pokémon Center product';

  if (product?.releaseType === 'restock') {
    return { title: name, body: 'Back in stock on Pokémon Center' };
  }
  if (product?.releaseType === 'preorder') {
    return { title: name, body: 'Preorder is live on Pokémon Center' };
  }
  return { title: name, body: 'Drop is live on Pokémon Center' };
}
