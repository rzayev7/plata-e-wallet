/*
 * Mirrors of the Spring DTOs. Keep these in step with the Java records —
 * the swagger schema at http://localhost:8080/v3/api-docs is the source of truth.
 */

export type Currency = "AZN" | "USD" | "EUR";

export const CURRENCIES: readonly Currency[] = ["AZN", "USD", "EUR"] as const;

export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

/** GET /accounts, POST /accounts/create — note `balance` is a MAJOR-unit string ("5.00"). */
export interface AccountResponseDto {
  id: string;
  currency: Currency;
  balance: string;
  status: AccountStatus;
}

/** POST /accounts/{id}/deposit and /withdraw — `balance` here is MINOR units (500). */
export interface BalanceResponseDto {
  accountId: string;
  balance: number;
  currency: Currency;
}

/** POST /accounts/{sourceId}/transfer */
export interface TransferMoneyResponseDto {
  amount: number;
  sourceAccId: string;
  destinationAccId: string;
  sourceAccBalance: number;
  destinationAccBalance: number;
}

/** Every error the backend produces: see common/exception/ErrorResponse.java */
export interface ErrorResponseDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}

/** POST /customers/login and /customers/refresh */
export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

/**
 * The account shape the UI works with: one money representation (minor units)
 * everywhere, so no screen has to remember which endpoint returned what.
 */
export interface Account {
  id: string;
  currency: Currency;
  status: AccountStatus;
  balanceMinor: number;
}

/**
 * What we know about the signed-in customer. The backend has no
 * GET /customers/me yet, so this is assembled from the JWT subject plus the
 * email the customer typed at login. Replace with a real profile fetch once
 * the endpoint exists.
 */
export interface SessionProfile {
  customerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
