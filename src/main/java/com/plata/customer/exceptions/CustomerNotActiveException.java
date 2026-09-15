package com.plata.customer.exceptions;

import com.plata.customer.enums.CustomerStatus;

public class CustomerNotActiveException extends RuntimeException {
    public CustomerNotActiveException(CustomerStatus status) {
        super("Customer account is " + status.name().toLowerCase());
    }
}