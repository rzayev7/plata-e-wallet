package com.plata.customer.service.impl;

import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.LoginResponse;
import com.plata.customer.entity.Customer;
import com.plata.customer.exceptions.EmailAlreadyExistsException;
import com.plata.customer.exceptions.InvalidCredentialsException;
import com.plata.customer.mapper.CustomerMapper;
import com.plata.customer.repository.CustomerRepository;
import com.plata.customer.service.CustomerService;
import java.util.Locale;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class CustomerServiceImpl implements CustomerService {
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public CustomerCreateResponseDto createCustomer(CustomerCreateRequestDto request) {

        String email = normalizeEmail(request.getEmail());

        if(customerRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        Customer customer = Customer.create(request.getFirstName(),request.getLastName(),email, request.getPhoneNumber(), passwordEncoder.encode(
                request.getRawPassword()));

        customerRepository.save(customer);

        return CustomerMapper.toDto(customer);
    }

    public LoginResponse loginCustomer(CustomerLoginRequestDto dto){

        String email = normalizeEmail(dto.getEmail());

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if(passwordEncoder.matches(dto.getPassword(),customer.getPasswordHash())){
            return new LoginResponse("Logged successfully");
        }
        throw new InvalidCredentialsException("Invalid Credentials");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
