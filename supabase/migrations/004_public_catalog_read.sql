-- Public catalog reads for the Expo app (including guest / anon key).
-- Product availability is not private user data.

create policy "catalog_public_read_regions"
  on public.regions for select to anon using (true);

create policy "catalog_public_read_retailers"
  on public.retailers for select to anon using (true);

create policy "catalog_public_read_retailer_regions"
  on public.retailer_regions for select to anon using (true);

create policy "catalog_public_read_tcgs"
  on public.tcgs for select to anon using (true);

create policy "catalog_public_read_categories"
  on public.product_categories for select to anon using (true);

create policy "catalog_public_read_products"
  on public.products for select to anon using (true);

create policy "catalog_public_read_events"
  on public.stock_events for select to anon
  using (verification_status in ('verified', 'detected'));
