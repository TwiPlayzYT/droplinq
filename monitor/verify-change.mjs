export async function confirmListingStillPresent(change, fetchAgain) {
  const listings = await fetchAgain();
  return listings.some(
    (item) =>
      item.externalProductId === change.listing.externalProductId &&
      item.stockStatus === change.listing.stockStatus,
  );
}
