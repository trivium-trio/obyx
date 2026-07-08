/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PaystackService {
    /**
     * Initialize Paystack payment checkout
     * Creates a Paystack payment session for mobile money. Returns an authorization URL to redirect the user to complete payment.
     *
     * @param requestBody
     * @returns any Checkout session created successfully
     * @throws ApiError
     */
    public static postPaystackCheckout(
        requestBody: {
            email: string;
            /**
             * Payment amount in KES
             */
            amountInKes: number;
            /**
             * EVM wallet address to receive the crypto
             */
            walletAddress: string;
        },
    ): CancelablePromise<{
        checkout_url?: string;
        reference?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/paystack/checkout',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request – invalid parameters`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Initiate M-Pesa STK Push payment
     * Triggers an M-Pesa STK (Sim Toolkit) push to the user's phone via Paystack. The user receives a payment prompt on their device to authorize the transaction.
     *
     * @param requestBody
     * @returns any STK Push initiated successfully
     * @throws ApiError
     */
    public static postPaystackChargeMpesa(
        requestBody: {
            /**
             * User's email address
             */
            email: string;
            /**
             * Payment amount in KES
             */
            amountInKes: number;
            /**
             * M-Pesa registered phone number
             */
            phoneNumber: string;
            /**
             * EVM wallet address to receive the crypto
             */
            walletAddress: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        /**
         * Paystack transaction reference
         */
        reference?: string;
        /**
         * User-facing prompt text
         */
        display_text?: string;
        /**
         * Full Paystack charge response
         */
        data?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/paystack/charge-mpesa',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request – missing or invalid parameters`,
                502: `Bad Gateway – upstream payment provider failure`,
            },
        });
    }
}
