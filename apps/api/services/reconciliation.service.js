import { sequelize } from '../models/index.js';

/**
 * Single source of truth for "payment confirmed -> ready for payout".
 * This safely transitions the state and prevents duplicate webhooks
 * or race conditions from triggering multiple payouts.
 * 
 * @param {string} reference - The Paystack payment reference
 * @returns {Promise<{transitioned: boolean, txId?: string}>}
 */
export async function reconcilePaid(reference) {
  // Use atomic conditional update to ensure only ONE trigger advances the state.
  const [rows] = await sequelize.query(
    `UPDATE "transactions"
     SET "status" = 'PAID', "paidAt" = now()
     WHERE "paystackReference" = $1 AND "status" = 'PROMPT_SENT'
     RETURNING id`,
    { bind: [reference] }
  );

  if (rows && rows.length === 1) {
    // Because we use a DB-polling worker, simply transitioning to PAID 
    // effectively "enqueues" the payout. The worker will pick it up.
    return { transitioned: true, txId: rows[0].id };
  }
  
  // Already processed by another trigger (or invalid state) — safe no-op.
  return { transitioned: false };
}

/**
 * Safe state transition for failed payments.
 * 
 * @param {string} reference - The Paystack payment reference
 * @param {string} reason - The failure reason to store
 */
export async function reconcileFailed(reference, reason) {
  await sequelize.query(
    `UPDATE "transactions"
     SET "status" = 'FAILED', "failureReason" = $2
     WHERE "paystackReference" = $1 AND "status" = 'PROMPT_SENT'`,
    { bind: [reference, reason] }
  );
}
