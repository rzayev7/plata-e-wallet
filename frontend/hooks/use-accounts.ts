"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { majorStringToMinor } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";
import type {
  Account,
  AccountResponseDto,
  BalanceResponseDto,
  Currency,
  TransferMoneyResponseDto,
} from "@/types/api";

/*
 * `GET /accounts` reports the balance as a major-unit string while the money
 * endpoints answer in minor units. Normalising here means no component has to
 * care: the UI works in minor units throughout.
 */
function toAccount(dto: AccountResponseDto): Account {
  return {
    id: dto.id,
    currency: dto.currency,
    status: dto.status,
    balanceMinor: majorStringToMinor(dto.balance),
  };
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => (await api<AccountResponseDto[]>("/accounts")).map(toAccount),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currency: Currency) =>
      api<AccountResponseDto>("/accounts/create", { method: "POST", body: { currency } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export interface MoneyMovement {
  accountId: string;
  /** Minor units — the only thing the backend accepts. */
  amount: number;
}

export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, amount }: MoneyMovement) =>
      api<BalanceResponseDto>(`/accounts/${accountId}/deposit`, { method: "POST", body: { amount } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, amount }: MoneyMovement) =>
      api<BalanceResponseDto>(`/accounts/${accountId}/withdraw`, { method: "POST", body: { amount } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

export interface TransferRequest extends MoneyMovement {
  destinationAccountId: string;
}

export function useTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, destinationAccountId, amount }: TransferRequest) =>
      api<TransferMoneyResponseDto>(`/accounts/${accountId}/transfer`, {
        method: "POST",
        body: { destinationAccountId, amount },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}
