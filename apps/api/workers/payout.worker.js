import { sequelize, User } from '../models/index.js';
import { sendUSDC } from '../services/circle.service.js';
import fs from 'fs';

function logAlert(message) {
  console.error(`[CRITICAL ALERT] ${message}`);
  fs.appendFileSync('alerts.log', `${new Date().toISOString()} - ${message}\n`);
}

export function startPayoutWorker() {
  console.log('[WORKER] Payout worker started.');
  
  // Polling every 5 seconds
  setInterval(async () => {
    let tx = null;
    try {
      // Atomically claim one job
      const [rows] = await sequelize.query(
        `UPDATE "transactions"
         SET "status" = 'PAYOUT_QUEUED'
         WHERE id = (
           SELECT id FROM "transactions"
           WHERE "status" = 'PAID'
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         RETURNING *`
      );

      if (!rows || rows.length === 0) return;

      tx = rows[0];
      console.log(`[WORKER] Picked up payout for tx ${tx.id}`);

      // Get user wallet
      const user = await User.findByPk(tx.userId);
      if (!user || !user.walletAddress) {
        throw new Error("User has no wallet address linked.");
      }

      // Execute Circle Transfer using tx.id as idempotencyKey
      const circleResult = await sendUSDC(
        user.walletAddress,
        parseFloat(tx.cryptoAmount),
        tx.id // idempotency key
      );

      // On success
      await sequelize.query(
        `UPDATE "transactions"
         SET "status" = 'PAYOUT_SENT', "circleTxId" = $2, "payoutSentAt" = now()
         WHERE id = $1`,
        { bind: [tx.id, circleResult.txId] }
      );
      
      console.log(`[WORKER] Payout sent successfully for tx ${tx.id}`);
      
    } catch (err) {
      console.error("[WORKER] Error in payout worker loop:", err);
      if (tx && tx.id) {
        logAlert(`PAYOUT_FAILED for tx ${tx.id}: ${err.message}`);
        try {
          await sequelize.query(
            `UPDATE "transactions"
             SET "status" = 'PAYOUT_FAILED', "failureReason" = $2
             WHERE id = $1`,
            { bind: [tx.id, err.message] }
          );
        } catch (dbErr) {
          console.error("[WORKER] Failed to even update status to PAYOUT_FAILED:", dbErr);
        }
      }
    }
  }, 5000);
}
