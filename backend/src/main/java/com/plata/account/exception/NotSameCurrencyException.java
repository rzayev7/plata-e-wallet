package com.plata.account.exception;

public class NotSameCurrencyException extends RuntimeException {
    public NotSameCurrencyException() {
        super("Not same currency");
    }
}
