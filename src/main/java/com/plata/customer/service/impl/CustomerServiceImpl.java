package com.plata.customer.service.impl;

import com.plata.common.security.JwtService;
import com.plata.customer.dto.CustomerCreateRequestDto;
import com.plata.customer.dto.CustomerCreateResponseDto;
import com.plata.customer.dto.CustomerListResponseDto;
import com.plata.customer.dto.CustomerLoginRequestDto;
import com.plata.customer.dto.CustomerLoginResponseDto;
import com.plata.customer.dto.CustomerResponseDto;
import com.plata.customer.dto.RefreshTokenRequestDto;
import com.plata.customer.entity.Customer;
import com.plata.customer.entity.RefreshToken;
import com.plata.customer.enums.CustomerStatus;
import com.plata.customer.exceptions.CustomerNotActiveException;
import com.plata.customer.exceptions.EmailAlreadyExistsException;
import com.plata.customer.exceptions.InvalidCredentialsException;
import com.plata.customer.exceptions.InvalidRefreshTokenException;
import com.plata.customer.mapper.CustomerMapper;
import com.plata.customer.repository.CustomerRepository;
import com.plata.customer.service.CustomerService;
import com.plata.customer.service.RefreshTokenService;
import java.util.List;
import java.util.Locale;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class CustomerServiceImpl implements CustomerService {
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    @Override
    @Transactional
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

    public CustomerLoginResponseDto loginCustomer(CustomerLoginRequestDto dto) {

        String email = normalizeEmail(dto.getEmail());

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), customer.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new CustomerNotActiveException(customer.getStatus());
        }

        return issueTokens(customer);
    }

    @Override
    @Transactional
    public CustomerLoginResponseDto refresh(RefreshTokenRequestDto dto) {
        RefreshToken oldToken = refreshTokenService.consume(dto.refreshToken());

        Customer customer = customerRepository.findById(oldToken.getCustomerId())
                .orElseThrow(InvalidRefreshTokenException::new);

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new CustomerNotActiveException(customer.getStatus());
        }

        return issueTokens(customer);
    }

    @Override
    public void logout(RefreshTokenRequestDto dto) {
        refreshTokenService.revoke(dto.refreshToken());
    }

    private CustomerLoginResponseDto issueTokens(Customer customer) {
        String accessToken = jwtService.generateAccessToken(customer);
        String refreshToken = refreshTokenService.create(customer.getId());

        return new CustomerLoginResponseDto(accessToken, refreshToken);
    }

    public CustomerListResponseDto listCustomers(){
        List<Customer> customers = customerRepository.findAll();
        List<CustomerResponseDto> dtos = customers.stream().map(customer ->
                new CustomerResponseDto(
                        customer.getId(),
                        customer.getFirstName(),
                        customer.getLastName(),
                        customer.getEmail()
                )).toList();
        return new CustomerListResponseDto(dtos);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
