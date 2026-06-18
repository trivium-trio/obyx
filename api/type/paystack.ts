// types/paystack.ts

// What we send to Paystack
export interface PaystackInitializeRequest {
  email: string;
  amount: number; // Must be in subunits (KES * 100)
  currency: 'KES';
  channels: ['mobile_money']; // Forces the M-Pesa/Mobile Money flow
  callback_url?: string;
  metadata?: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
}

// What Paystack sends back to us
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string; // The URL to redirect the user to
    access_code: string;
    reference: string; // The unique transaction ID we will save to our DB
  };
}