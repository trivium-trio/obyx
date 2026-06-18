// =============================================================================
// PAYSTACK SERVICE (MOCK)
// ----- Friend 2: Replace mock implementations with real Paystack API calls -----
//
// This module handles all communication with Paystack's payment APIs.
// Currently returns dummy responses so the orchestrator can be developed
// and tested independently.
// =============================================================================

/**
 * Initiate an STK Push (Mobile Money prompt) to the user's phone.
 *
 * @param {string} phoneNumber - User's mobile money number (e.g., "254712345678")
 * @param {number} amount      - Amount in KES to charge
 * @param {string} reference   - Unique reference for this payment (Transaction ID)
 * @returns {Promise<object>}  - Paystack API response with a reference ID
 *
 * TODO (Friend 2):
 *   - Hit POST https://api.paystack.co/charge with your secret key
 *   - Set the mobile_money provider (e.g., "mpesa")
 *   - Return the actual Paystack reference from the response
 */
export const initiateSTKPush = async (phoneNumber, amount, reference) => {
  console.log(`[PAYSTACK MOCK] STK Push -> Phone: ${phoneNumber}, Amount: ${amount} KES, Ref: ${reference}`);

  // Simulate a short network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return {
    status: true,
    message: 'Charge attempted',
    data: {
      reference: reference, // In production, Paystack generates this
      status: 'send_otp',   // Paystack's intermediate status
    },
  };
};

/**
 * Verify a payment's status with Paystack.
 *
 * @param {string} reference - The Paystack payment reference to verify
 * @returns {Promise<object>} - Paystack verification response
 *
 * TODO (Friend 2):
 *   - Hit GET https://api.paystack.co/transaction/verify/:reference
 *   - Return { status: 'success', amount, currency } from the response
 */
export const verifyPayment = async (reference) => {
  console.log(`[PAYSTACK MOCK] Verifying payment: ${reference}`);

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    status: true,
    data: {
      status: 'success',
      amount: 0,       // Amount in kobo/pesewas — Friend 2 will parse this
      currency: 'KES',
      reference,
    },
  };
};
