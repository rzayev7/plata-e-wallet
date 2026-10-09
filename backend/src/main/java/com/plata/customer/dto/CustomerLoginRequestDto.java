package com.plata.customer.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerLoginRequestDto {
    private String email;
    private String password;
}
