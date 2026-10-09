package com.plata.customer.exception;

import com.plata.customer.enums.CustomerStatus;

public class CustomerNotActiveException extends RuntimeException {
    public CustomerNotActiveException(CustomerStatus status) {
        super("Customer account is " + status.name().toLowerCase());
    }
}