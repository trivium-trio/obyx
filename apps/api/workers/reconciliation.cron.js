import { sequelize } from '../models/index.js';
import { verifyPayment } from '../services/paystack.service.js';
import { reconcilePaid, reconcileFailed } from '../services/reconciliation.service.js';
import fs from 'fs';

function logAlert(message) {
  console.error(`[CRITICAL ALERT] ${message}`);
  fs.appendFileSync('alerts.log', `${new Date().toISOString()} - ${message}\n`);
}

const CUTOFF_MS = (process.env.RECONCILIATION_TIMEOUT_MINUTES || 15) * 60 * 1000;

export function startReconciliationCron() {
  console.log('[CRON] Reconciliation fallback started.');
  
  // Run every 1 minute
  setInterval(async () => {
    try {
      // Find transactions stuck in PROMPT_SENT for more than 2 minutes
      const [stuck] = await sequelize.query(`
        SELECT * FROM "transactions"
        WHERE "status" = 'PROMPT_SENT' 
          AND "createdAt" < NOW() - interval '2 minutes'
          LIMIT 50
      `);

      const now = Date.now();

      for (const tx of stuck) {
        const txAge = now - new Date(tx.createdAt).getTime();
        const isExceededCutoff = txAge > CUTOFF_MS;

        console.log(`[CRON] Verifying stuck tx ${tx.id} with Paystack...`);
        try {
          const verified = await verifyPayment(tx.paystackReference);
          
          if (verified.status === true && verified.data.status === 'success') {
            await reconcilePaid(tx.paystackReference);
            console.log(`[CRON] Reconciled tx ${tx.id} as PAID.`);
          } else if (verified.data && verified.data.status === 'failed') {
            await reconcileFailed(tx.paystackReference, 'Paystack API reported failure via cron');
            console.log(`[CRON] Reconciled tx ${tx.id} as FAILED.`);
          } else {
            // If status is 'pending' or 'send_otp' etc.
            if (isExceededCutoff) {
              const reason = `Transaction exceeded maximum pending cutoff (${Math.round(txAge / 60000)}m) in PROMPT_SENT without confirmation`;
              logAlert(`STUCK_TRANSACTION_TERMINATED for tx ${tx.id}: ${reason}`);
              await reconcileFailed(tx.paystackReference, reason);
              console.log(`[CRON] Terminated stale pending tx ${tx.id} as FAILED.`);
            } // Otherwise preserve retry behavior before the cutoff
          }
        } catch (vErr) {
          console.error(`[CRON] Failed to verify tx ${tx.id}:`, vErr.message);
          if (isExceededCutoff) {
            const reason = `Transaction exceeded maximum pending cutoff (${Math.round(txAge / 60000)}m) while verifyPayment failed: ${vErr.message}`;
            logAlert(`STUCK_TRANSACTION_TERMINATED for tx ${tx.id}: ${reason}`);
            try {
              await reconcileFailed(tx.paystackReference, reason);
              console.log(`[CRON] Terminated unverified stale tx ${tx.id} as FAILED.`);
            } catch (rErr) {
              console.error(`[CRON] Failed to reconcileFailed for tx ${tx.id}:`, rErr.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('[CRON] Error running reconciliation cron:', err);
    }
  }, 60000); // 60 seconds
}
