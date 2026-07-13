import 'dotenv/config';
import { sendUSDC, getTransferStatus } from '../../services/circle.service.js';

async function run() {
  try {
    const destination = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Test address
    const amount = 1; // 1 USDC

    console.log(`Sending ${amount} USDC to ${destination}...`);
    const result = await sendUSDC(destination, amount);
    console.log("sendUSDC result:", result);

    console.log("\nPolling for status for 15 seconds...");
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const status = await getTransferStatus(result.txId);
      console.log(`Status attempt ${i + 1}:`, JSON.stringify(status.transaction || status, null, 2));
      const state = status.transaction ? status.transaction.state : status.state;
      if (state === 'COMPLETE' || state === 'FAILED') {
        console.log("Final status:", JSON.stringify(status, null, 2));
        break;
      }
    }
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

run();
