import { getSupabase } from '@/services/supabase/client';
import { FilterPreferences } from '@/types/filters';
import { defaultFilterPreferences } from '@/data/pokemon-center-filters';

export type LoadedCoverage = Pick<
  FilterPreferences,
  'coverageMode' | 'includeOtherTcgProducts' | 'customCategoryIds' | 'retailerId' | 'tcgId'
>;

export async function loadCoveragePreferences(
  userId: string,
  regionId: string,
  filters: FilterPreferences,
): Promise<LoadedCoverage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_coverage_preferences')
    .select('coverage_mode, include_other_tcg_products, retailer_id, tcg_id')
    .eq('user_id', userId)
    .eq('region_id', regionId)
    .maybeSingle();

  if (error || !data) return null;

  let customCategoryIds = filters.customCategoryIds;
  if (data.coverage_mode === 'CUSTOM') {
    const { data: cats } = await supabase
      .from('user_custom_category_preferences')
      .select('category_id')
      .eq('user_id', userId)
      .eq('retailer_id', data.retailer_id)
      .eq('region_id', regionId)
      .eq('tcg_id', data.tcg_id)
      .eq('enabled', true);
    customCategoryIds = (cats ?? []).map((row) => row.category_id);
  }

  return {
    retailerId: data.retailer_id ?? defaultFilterPreferences.retailerId,
    tcgId: data.tcg_id ?? defaultFilterPreferences.tcgId,
    coverageMode: (data.coverage_mode === 'POPULAR' ||
    data.coverage_mode === 'ALL_TCG' ||
    data.coverage_mode === 'CUSTOM'
      ? data.coverage_mode
      : 'ALL_TCG') as LoadedCoverage['coverageMode'],
    includeOtherTcgProducts: data.include_other_tcg_products,
    customCategoryIds,
  };
}

/** Persist coverage prefs for signed-in users when Supabase is configured. */
export async function syncCoveragePreferences(
  userId: string,
  regionId: string,
  filters: FilterPreferences,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('user_coverage_preferences').upsert(
    {
      user_id: userId,
      retailer_id: filters.retailerId,
      region_id: regionId,
      tcg_id: filters.tcgId,
      coverage_mode: filters.coverageMode,
      include_other_tcg_products: filters.includeOtherTcgProducts,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,retailer_id,region_id,tcg_id' },
  );
  if (error) throw error;

  if (filters.coverageMode !== 'CUSTOM') return;

  await supabase
    .from('user_custom_category_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('retailer_id', filters.retailerId)
    .eq('region_id', regionId)
    .eq('tcg_id', filters.tcgId);

  if (!filters.customCategoryIds.length) return;

  const rows = filters.customCategoryIds.map((categoryId) => ({
    user_id: userId,
    retailer_id: filters.retailerId,
    region_id: regionId,
    tcg_id: filters.tcgId,
    category_id: categoryId,
    enabled: true,
  }));
  const { error: catError } = await supabase
    .from('user_custom_category_preferences')
    .insert(rows);
  if (catError) throw catError;
}
