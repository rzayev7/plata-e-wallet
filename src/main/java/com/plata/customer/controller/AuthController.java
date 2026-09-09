package com.plata.customer.controller;

import com.plata.customer.dto.CustomerResponse;
import com.plata.customer.dto.LoginRequest;
import com.plata.customer.dto.RegisterRequest;
import com.plata.customer.entity.Customer;
import com.plata.customer.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Thin on purpose: validate, call the service, map to a DTO.
 * No business rules live here.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final CustomerService customerService;

    public AuthController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping("/register")
    public ResponseEntity<CustomerResponse> register(@Valid @RequestBody RegisterRequest request) {
        Customer customer = customerService.register(
                request.email(),
                request.password(),
                request.firstName(),
                request.lastName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(CustomerResponse.from(customer));
    }

    @PostMapping("/login")
    public ResponseEntity<CustomerResponse> login(@Valid @RequestBody LoginRequest request) {
        Customer customer = customerService.login(request.email(), request.password());
        return ResponseEntity.ok(CustomerResponse.from(customer));
    }
}
