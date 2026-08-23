import { DetectedChange, VerificationResult } from '@/services/monitoring/types';

/**
 * A detected change is not an alert.
 * Production monitors should re-fetch the product page (or a second catalog pass)
 * before setting verified_at.
 */
export async function verifyChange(
  change: DetectedChange,
  confirm: (change: DetectedChange) => Promise<boolean>,
): Promise<VerificationResult> {
  try {
    const ok = await confirm(change);
    if (!ok) {
      return {
        verified: false,
        confidenceScore: 0.2,
        reason: 'Second look did not confirm the change.',
      };
    }
    return {
      verified: true,
      confidenceScore: 0.85,
      verifiedAt: new Date().toISOString(),
      reason: 'Confirmed by a second observation.',
    };
  } catch (error) {
    return {
      verified: false,
      confidenceScore: 0,
      reason: error instanceof Error ? error.message : 'Verification failed.',
    };
  }
}
