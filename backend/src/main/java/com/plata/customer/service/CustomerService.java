package com.plata.customer.service;

import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerListResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.CustomerLoginResponseDto;
import com.plata.customer.dto.RefreshTokenRequestDto;

public interface CustomerService {
    CustomerCreateResponseDto createCustomer(CustomerCreateRequestDto request);
    CustomerLoginResponseDto loginCustomer(CustomerLoginRequestDto request);
    CustomerLoginResponseDto refresh(RefreshTokenRequestDto request);
    void logout(RefreshTokenRequestDto request);
    CustomerListResponseDto listCustomers();
}
