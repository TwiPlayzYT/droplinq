import { getSupabase } from '@/services/supabase/client';
import { FilterPreferences } from '@/types/filters';

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
