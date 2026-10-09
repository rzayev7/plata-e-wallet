package com.plata.account.exception;

import java.util.UUID;

public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException(UUID accountId, long balance, long amount) {
        super("Account " + accountId + " has insufficient funds: balance " + balance + ", requested " + amount);
    }
}
