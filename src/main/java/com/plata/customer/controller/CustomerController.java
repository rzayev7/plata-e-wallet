package com.plata.customer.controller;

import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerListResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.CustomerLoginResponseDto;
import com.plata.customer.dto.RefreshTokenRequestDto;
import com.plata.customer.service.CustomerService;
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
    public CustomerLoginResponseDto loginCustomer(@RequestBody CustomerLoginRequestDto dto){
        return customerService.loginCustomer(dto);
    }
    @PostMapping("/refresh")
    public CustomerLoginResponseDto refresh(@Valid @RequestBody RefreshTokenRequestDto dto) {
        return customerService.refresh(dto);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequestDto dto) {
        customerService.logout(dto);
    }

    @GetMapping
    public CustomerListResponseDto getCustomers(){
        return customerService.listCustomers();
    }
}
