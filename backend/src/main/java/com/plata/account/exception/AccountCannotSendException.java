package com.plata.account.exception;

public class AccountCannotSendException extends RuntimeException {
    public AccountCannotSendException() {
        super("Account can't send amount");
    }
}
