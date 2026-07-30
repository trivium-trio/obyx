// =============================================================================
// PAYSTACK SERVICE (MOCK)
// ----- Friend 2: Replace mock implementations with real Paystack API calls -----
//
// This module handles all communication with Paystack's payment APIs.
// Currently returns dummy responses so the orchestrator can be developed
// and tested independently.
// =============================================================================

// PAYSTACK SERVICE
// This module handles communication with Paystack's payment APIs, including
// M-Pesa STK Push charges and payment verifications.
// =============================================================================
import config from '../config/env.js';
import { User } from '../models/index.js';

/**
 * Trigger a real M-Pesa STK Push via Paystack Charge API.
 *
 * @param {string} email         - User email address
 * @param {number} amountInKes   - Amount in KES to charge
 * @param {string} phoneNumber   - User's M-Pesa phone number
 * @param {string} walletAddress - Target EVM wallet address for metadata
 * @returns {Promise<object>}    - Paystack success data (reference, display_text, etc.)
 */
export const triggerMpesaSTK = async (email, amountInKes, phoneNumber, walletAddress) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || config.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }

  // Paystack requires the '+' prefix for E.164 format (e.g. "+254712345678")
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;

  const payload = {
    email: email,
    amount: Math.round(amountInKes * 100),
    currency: 'KES',
    mobile_money: {
      phone: cleanPhone,
      provider: 'mpesa',
    },
    metadata: {
      custom_fields: [
        {
          display_name: 'Wallet Address',
          variable_name: 'wallet_address',
          value: walletAddress || '0x0000000000000000000000000000000000000000',
        },
      ],
    },
  };

  console.log("[PAYSTACK] Sending charge request:", JSON.stringify({
    email: payload.email,
    amount: payload.amount,
    currency: payload.currency,
    mobile_money: payload.mobile_money,
  }));

  const response = await fetch('https://api.paystack.co/charge', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  console.log("[PAYSTACK] Response:", JSON.stringify({
    httpStatus: response.status,
    status: result.status,
    message: result.message,
    data: result.data,
  }));

  if (!response.ok || !result.status) {
    console.error("[PAYSTACK] Charge request failed", {
      httpStatus: response.status,
      fullResponse: JSON.stringify(result),
    });
    throw new Error(result?.message || "Failed to initiate M-Pesa STK Push");
  }

  return result.data;
};

/**
 * Initiate an STK Push (Mobile Money prompt) to the user's phone.
 * Maintained for backwards compatibility with existing onramp routes.
 *
 * @param {string} phoneNumber - User's mobile money number (e.g., "254712345678")
 * @param {number} amount      - Amount in KES to charge
 * @returns {Promise<object>}  - Paystack API response formatted for legacy callers
 */
export const initiateSTKPush = async (phoneNumber, amount) => {
  const data = await triggerMpesaSTK('onramp@obyx.co', amount, phoneNumber, '0x0000000000000000000000000000000000000000');
  return {
    status: true,
    message: 'Charge attempted',
    data: {
      reference: data.reference,
      status: data.status || 'send_otp',
    },
  };
};

/**
 * Verify a payment's status with Paystack.
 *
 * @param {string} reference - The Paystack payment reference to verify
 * @returns {Promise<object>} - Paystack verification response
 */
export const verifyPayment = async (reference) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || config.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok || !result.status) {
    console.error("[PAYSTACK] Verification request failed", {
      httpStatus: response.status,
      message: result?.message,
    });
    throw new Error(result?.message || "Payment verification failed");
  }

  return {
    status: true,
    data: {
      status: result.data.status,
      amount: result.data.amount / 100,
      currency: result.data.currency,
      reference: result.data.reference || reference,
    },
  };
};

/**
 * Create a Transfer Recipient for Mobile Money payouts.
 */
export const createTransferRecipient = async (name, phoneNumber) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || config.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured.');

  const payload = {
    type: 'mobile_money',
    name: name,
    account_number: phoneNumber,
    bank_code: 'MPESA',
    currency: 'KES',
  };

  const response = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result.status) {
    throw new Error(result?.message || 'Failed to create transfer recipient');
  }

  return result.data;
};

/**
 * Initiate a Transfer (Payout) to a recipient.
 */
export const initiateTransfer = async (amountInKes, recipientCode, reference) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || config.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured.');

  const payload = {
    source: 'balance',
    amount: Math.round(amountInKes * 100),
    recipient: recipientCode,
    reason: 'Obyx Off-ramp Payout',
    reference: reference,
  };

  const response = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result.status) {
    throw new Error(result?.message || 'Failed to initiate transfer');
  }

  return result.data;
};

/**
 * Execute an off-ramp payout via Paystack once USDC deposit is confirmed.
 *
 * @param {string} name - Recipient name for the payout recipient
 * @param {string} phoneNumber - Recipient mobile money phone number
 * @param {number} amountInKes - Amount in KES to disburse
 * @param {string} reference - Unique reference for idempotency and tracing
 * @returns {Promise<object>} - Paystack transfer response
 */
/**
 * Execute an off-ramp payout once the Treasury has received the USDc deposit.
 * This is a terminal payout step for the off-ramp flow.
 *
 * @param {import('../models/transaction.js').default} transaction
 * @returns {Promise<void>}
 */
export const executeOfframpPayout = async (transaction) => {
  const user = await User.findByPk(transaction.userId);
  if (!user) {
    throw new Error(`User missing for transaction ${transaction.id}`);
  }
  if (!user.phoneNumber) {
    throw new Error(`User phone number missing for transaction ${transaction.id}`);
  }

  const recipient = await createTransferRecipient('Obyx Offramp Recipient', user.phoneNumber);
  const transfer = await initiateTransfer(transaction.fiatAmount, recipient.recipient_code, transaction.id);

  await transaction.update({
    status: 'COMPLETED',
    failureReason: null,
  });

  console.log(`[PAYSTACK] Offramp payout completed for tx ${transaction.id}, transfer id: ${transfer.id || transaction.id}`);
};
