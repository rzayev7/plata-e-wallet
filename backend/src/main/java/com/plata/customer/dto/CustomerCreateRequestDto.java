package com.plata.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerCreateRequestDto {
    @NotBlank
    @Email
    private String email;
    private String rawPassword;
    private String firstName;
    private String lastName;
    private String phoneNumber;
}
