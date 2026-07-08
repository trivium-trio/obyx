/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Transaction } from '../models/Transaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * Link a wallet address to a user account
     * Associates an Ethereum wallet address with the authenticated user.
     * @param requestBody
     * @returns any Wallet linked successfully
     * @throws ApiError
     */
    public static postUserLinkWallet(
        requestBody: {
            /**
             * The Ethereum wallet address to link (0x...)
             */
            walletAddress: string;
        },
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
        data?: {
            userId?: string;
            walletAddress?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/link-wallet',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request (Missing or invalid wallet address)`,
                404: `User not found`,
                409: `Conflict (Wallet already linked to another account)`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get user transaction ledger
     * Fetches the authenticated user's transaction ledger, returning a list of all on-ramp and off-ramp transactions ordered by newest first.
     *
     * @returns any Transaction ledger retrieved successfully
     * @throws ApiError
     */
    public static getUserTransactions(): CancelablePromise<{
        success?: boolean;
        data?: Array<Transaction>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/transactions',
            errors: {
                500: `Internal server error`,
            },
        });
    }
}
