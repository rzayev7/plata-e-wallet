package com.plata.customer.mapper;

import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.entity.Customer;

public class CustomerMapper {

    public static CustomerCreateResponseDto toDto(Customer entity) {
        return CustomerCreateResponseDto
                .builder()
                .email(entity.getEmail())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .phoneNumber(entity.getPhoneNumber())
                .build();
    }
}
