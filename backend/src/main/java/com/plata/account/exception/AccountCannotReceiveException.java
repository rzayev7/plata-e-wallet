package com.plata.account.exception;

import com.plata.account.enums.AccountStatus;

import java.util.UUID;

public class AccountCannotReceiveException extends RuntimeException {
    public AccountCannotReceiveException(UUID accountId, AccountStatus status) {
        super("Account " + accountId + " is " + status + " and cannot receive money");
    }
}
