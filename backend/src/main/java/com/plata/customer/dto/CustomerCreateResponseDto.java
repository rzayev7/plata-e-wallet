package com.plata.customer.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CustomerCreateResponseDto {
    private String firstName;
    private String lastName;

    private String email;
    private String phoneNumber;
}
