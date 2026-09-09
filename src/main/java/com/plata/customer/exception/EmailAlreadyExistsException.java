package com.plata.customer.exception;

import com.plata.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class EmailAlreadyExistsException extends BusinessException {

    public EmailAlreadyExistsException(String email) {
        super(HttpStatus.CONFLICT, "Email already registered: " + email);
    }
}
