package com.plata.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for expected business failures (email taken, wrong password, ...).
 *
 * Each module throws its own subclass; GlobalExceptionHandler turns any of them
 * into an HTTP response, so no module needs its own @RestControllerAdvice.
 */
public abstract class BusinessException extends RuntimeException {

    private final HttpStatus status;

    protected BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
