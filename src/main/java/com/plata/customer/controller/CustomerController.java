package com.plata.customer.controller;

import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.LoginResponse;
import com.plata.customer.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.Mapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
public class CustomerController {
    private CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerCreateResponseDto createCustomer(@Valid @RequestBody CustomerCreateRequestDto dto) {
        return customerService.createCustomer(dto);
    }
    @PostMapping("/login")
    public LoginResponse loginCustomer(@RequestBody CustomerLoginRequestDto dto){
        return customerService.loginCustomer(dto);
    }
}
