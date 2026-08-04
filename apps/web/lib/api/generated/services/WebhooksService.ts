/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WebhooksService {
    /**
     * Paystack payment webhook
     * Receives verified Paystack webhook events for payment processing. On a successful charge, the system updates the transaction status, triggers a USDC disbursement via Circle, and records the on-chain transaction hash. Always responds 200 immediately to prevent Paystack retries.
     *
     * @returns any Webhook acknowledged
     * @throws ApiError
     */
    public static postWebhooksPaystack(): CancelablePromise<{
        received?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/webhooks/paystack',
        });
    }
}
