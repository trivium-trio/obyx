/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { Transaction } from '../models/Transaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OnrampService {
    /**
     * Initiate fiat-to-crypto on-ramp
     * Rate-limited endpoint that triggers the on-ramp pipeline. Accepts a fiat amount in KES and initiates an M-Pesa STK push via Paystack to begin the conversion to USDC.
     *
     * @param requestBody
     * @returns any On-ramp pipeline initiated successfully
     * @throws ApiError
     */
    public static postOnrampInit(
        requestBody: {
            /**
             * Amount in KES to convert
             */
            fiatAmount: number;
            /**
             * M-Pesa phone number for the STK push (e.g. +254712345678). Optional — falls back to user profile.
             */
            phoneNumber?: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
        data?: {
            transactionId?: string;
            fiatAmount?: number;
            cryptoAmount?: number;
            exchangeRate?: number;
            status?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/onramp/init',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request – invalid or missing fiatAmount`,
                429: `Too many requests – rate limit exceeded`,
                500: `Internal server error`,
                502: `Payment initiation failed`,
            },
        });
    }
    /**
     * Get transaction status
     * Read-only endpoint allowing the frontend to poll for transaction status updates by transaction ID.
     *
     * @param id The unique transaction ID
     * @returns any Transaction status retrieved successfully
     * @throws ApiError
     */
    public static getOnrampStatus(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: Transaction;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/onramp/status/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Unauthorized – not your transaction`,
                404: `Transaction not found`,
                500: `Internal server error`,
            },
        });
    }
}
