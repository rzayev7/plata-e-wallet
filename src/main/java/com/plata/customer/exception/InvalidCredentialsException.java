package com.plata.customer.exception;

import com.plata.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends BusinessException {

    public InvalidCredentialsException() {
        // Deliberately vague: never reveal whether it was the email or the password
        // that was wrong, or an attacker can use it to enumerate registered emails.
        super(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
