package com.plata.customer.service;

import com.plata.customer.entity.Customer;
import com.plata.customer.exception.EmailAlreadyExistsException;
import com.plata.customer.exception.InvalidCredentialsException;
import com.plata.customer.repository.CustomerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    // Constructor injection, not @Autowired on fields: dependencies stay visible
    // and the class can be built by hand in a unit test.
    public CustomerService(CustomerRepository customerRepository, PasswordEncoder passwordEncoder) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Customer register(String email, String rawPassword, String firstName, String lastName) {
        String normalizedEmail = Customer.normalizeEmail(email);

        if (customerRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        String passwordHash = passwordEncoder.encode(rawPassword);
        Customer customer = Customer.register(normalizedEmail, passwordHash, firstName, lastName);
        return customerRepository.save(customer);
    }

    @Transactional(readOnly = true)
    public Customer login(String email, String rawPassword) {
        Customer customer = customerRepository.findByEmail(Customer.normalizeEmail(email))
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(rawPassword, customer.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        if (!customer.isActive()) {
            throw new InvalidCredentialsException();
        }
        return customer;
    }
}
