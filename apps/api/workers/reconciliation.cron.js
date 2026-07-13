import { sequelize } from '../models/index.js';
import { verifyPayment } from '../services/paystack.service.js';
import { reconcilePaid, reconcileFailed } from '../services/reconciliation.service.js';

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
      `);

      for (const tx of stuck) {
        console.log(`[CRON] Verifying stuck tx ${tx.id} with Paystack...`);
        try {
          const verified = await verifyPayment(tx.paystackReference);
          
          if (verified.status === true && verified.data.status === 'success') {
            await reconcilePaid(tx.paystackReference);
            console.log(`[CRON] Reconciled tx ${tx.id} as PAID.`);
          } else if (verified.data && verified.data.status === 'failed') {
            await reconcileFailed(tx.paystackReference, 'Paystack API reported failure via cron');
            console.log(`[CRON] Reconciled tx ${tx.id} as FAILED.`);
          }
          // If status is 'pending' or 'send_otp', we just leave it for the next cron run
        } catch (vErr) {
          console.error(`[CRON] Failed to verify tx ${tx.id}:`, vErr.message);
        }
      }
    } catch (err) {
      console.error('[CRON] Error running reconciliation cron:', err);
    }
  }, 60000); // 60 seconds
}
