package com.plata.customer.dto;

import java.util.List;

public class CustomerListResponseDto {
    private List<CustomerResponseDto> customers;
    public CustomerListResponseDto(List<CustomerResponseDto> customers) {
        this.customers = customers;
    }
    public List<CustomerResponseDto> getCustomers() {
        return customers;
    }
}
