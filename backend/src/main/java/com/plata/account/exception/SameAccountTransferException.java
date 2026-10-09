package com.plata.account.exception;

import java.util.UUID;

public class SameAccountTransferException extends RuntimeException {
    public SameAccountTransferException(UUID accountId) {
        super("Source and destination accounts cannot be the same: " + accountId);
    }
}
