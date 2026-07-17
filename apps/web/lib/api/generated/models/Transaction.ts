/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Transaction = {
    id?: string;
    userId?: string;
    type?: Transaction.type;
    status?: Transaction.status;
    fiatAmount?: number;
    fiatCurrency?: string;
    cryptoAmount?: number;
    cryptoCurrency?: string;
    exchangeRate?: number;
    paystackReference?: string | null;
    txHash?: string | null;
    createdAt?: string;
    updatedAt?: string;
};
export namespace Transaction {
    export enum type {
        ONRAMP = 'ONRAMP',
        OFFRAMP = 'OFFRAMP',
    }
    export enum status {
        INITIATED = 'INITIATED',
        PROMPT_SENT = 'PROMPT_SENT',
        PAID = 'PAID',
        PAYOUT_QUEUED = 'PAYOUT_QUEUED',
        PAYOUT_SENT = 'PAYOUT_SENT',
        FAILED = 'FAILED',
        PAYOUT_FAILED = 'PAYOUT_FAILED',
    }
}

