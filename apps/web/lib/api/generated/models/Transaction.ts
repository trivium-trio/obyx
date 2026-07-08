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
        PENDING = 'PENDING',
        FIAT_PROCESSING = 'FIAT_PROCESSING',
        FIAT_RECEIVED = 'FIAT_RECEIVED',
        CRYPTO_PROCESSING = 'CRYPTO_PROCESSING',
        COMPLETED = 'COMPLETED',
        FAILED = 'FAILED',
        REFUNDED = 'REFUNDED',
    }
}

