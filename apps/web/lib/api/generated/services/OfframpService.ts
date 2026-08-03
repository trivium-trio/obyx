/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Transaction } from '../models/Transaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OfframpService {
    /**
     * Initiate crypto-to-fiat off-ramp
     * Initiates an off-ramp transaction. Accepts a USDC amount, verifies limits, and returns the generated transaction ID along with calculated fiat value.
     *
     * @param requestBody
     * @returns any Off-ramp transaction created successfully
     * @throws ApiError
     */
    public static postOfframpInit(
        requestBody: {
            /**
             * Amount in USDC to convert
             */
            usdcAmount: number;
        },
    ): CancelablePromise<{
        success?: boolean;
        data?: {
            transactionId?: string;
            cryptoAmount?: number;
            fiatAmount?: number;
            exchangeRate?: number;
            status?: string;
            treasuryAddress?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/offramp/init',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request – invalid amount or missing user phone number`,
                404: `User not found`,
                429: `Too many requests`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Confirm off-ramp USDC transfer
     * Called by the frontend after the user signs the EVM transaction transferring USDC to the treasury. Triggers the internal fiat payout pipeline.
     *
     * @param requestBody
     * @returns any Transaction confirmed and payout processing
     * @throws ApiError
     */
    public static postOfframpConfirm(
        requestBody: {
            transactionId: string;
            /**
             * The EVM transaction hash of the USDC transfer
             */
            txHash: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/offramp/confirm',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Transaction already processing or invalid state`,
                404: `Transaction not found`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get off-ramp transaction status
     * Read-only endpoint allowing the frontend to poll for transaction status updates by transaction ID.
     *
     * @param id The unique transaction ID
     * @returns any Transaction status retrieved successfully
     * @throws ApiError
     */
    public static getOfframpStatus(
        id: string,
    ): CancelablePromise<{
        success?: boolean;
        data?: Transaction;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/offramp/status/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Transaction not found`,
                500: `Internal server error`,
            },
        });
    }
}
