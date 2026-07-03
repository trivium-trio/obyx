// =============================================================================
// PAYSTACK SERVICE
// This module handles communication with Paystack's payment APIs, including
// M-Pesa STK Push charges and payment verifications.
// =============================================================================
import config from '../config/env.js';

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

  // Some legacy callers pass our internal transaction ID as the 4th argument.
  // If a non-EVM value is provided, treat it as the Paystack `reference`.
  const isEvmAddress = typeof walletAddress === 'string' && walletAddress.startsWith('0x');
  const paystackReference = isEvmAddress ? undefined : walletAddress;
  const walletAddrForMetadata = isEvmAddress
    ? walletAddress
    : '0x0000000000000000000000000000000000000000';

  const payload = {
    email: email,
    amount: Math.round(amountInKes * 100),
    currency: 'KES',
    ...(paystackReference ? { reference: paystackReference } : {}),
    mobile_money: {
      phone: phoneNumber,
      provider: 'mpesa',
    },
    metadata: {
      custom_fields: [
        {
          display_name: 'Wallet Address',
          variable_name: 'wallet_address',
          value: walletAddrForMetadata,
        },
      ],
    },
  };

  const response = await fetch('https://api.paystack.co/charge', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result.status) {
    console.error("[PAYSTACK] Charge request failed", {
      httpStatus: response.status,
      message: result?.message,
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
 * @param {string} reference   - Unique reference for this payment (Transaction ID)
 * @returns {Promise<object>}  - Paystack API response formatted for legacy callers
 */
export const initiateSTKPush = async (phoneNumber, amount, reference) => {
  const data = await triggerMpesaSTK('onramp@obyx.co', amount, phoneNumber, reference || '0x0000000000000000000000000000000000000000');
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
      reference: result.data.reference,
    },
  };
};
