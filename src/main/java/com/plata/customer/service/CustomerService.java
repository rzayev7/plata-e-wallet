package com.plata.customer.service;

import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.LoginResponse;
import com.plata.customer.entity.Customer;

public interface CustomerService {
    CustomerCreateResponseDto createCustomer(CustomerCreateRequestDto request);
    LoginResponse loginCustomer(CustomerLoginRequestDto request);
}
