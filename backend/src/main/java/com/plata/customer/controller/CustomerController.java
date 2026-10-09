package com.plata.customer.controller;

import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerListResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.CustomerLoginResponseDto;
import com.plata.customer.dto.RefreshTokenRequestDto;
import com.plata.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
@Tag(
        name = "Customers",
        description = "Customer registration and authentication"
)
public class CustomerController {
    private CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Operation(
            summary = "Create customer",
            description = "Registers a new customer"
    )
    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerCreateResponseDto createCustomer(@Valid @RequestBody CustomerCreateRequestDto dto) {
        return customerService.createCustomer(dto);
    }
    @Operation(
            summary = "Login",
            description = "Authenticates a customer and returns access and refresh tokens"
    )
    @PostMapping("/login")
    public CustomerLoginResponseDto loginCustomer(@RequestBody CustomerLoginRequestDto dto){
        return customerService.loginCustomer(dto);
    }
    @Operation(
            summary = "Refresh access token",
            description = "Generates a new access token using a valid refresh token"
    )
    @PostMapping("/refresh")
    public CustomerLoginResponseDto refresh(@Valid @RequestBody RefreshTokenRequestDto dto) {
        return customerService.refresh(dto);
    }
    @Operation(
            summary = "Logout",
            description = "Invalidates the customer's refresh token"
    )
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequestDto dto) {
        customerService.logout(dto);
    }
    @Operation(
            summary = "List customers",
            description = "Returns every registered customer, for picking someone to message"
    )
    @GetMapping
    public CustomerListResponseDto listCustomers() {
        return customerService.listCustomers();
    }
}
