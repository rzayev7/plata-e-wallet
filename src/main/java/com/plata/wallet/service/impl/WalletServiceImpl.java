package com.plata.wallet.service.impl;

import com.plata.customer.entity.Customer;
import com.plata.wallet.entity.Wallet;
import com.plata.wallet.repository.WalletRepository;
import com.plata.wallet.service.WalletService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class WalletServiceImpl implements WalletService {
    private final WalletRepository walletRepository;

    @Override
    public Wallet createWallet(Customer customer) {
        return walletRepository.save(Wallet.createWallet(customer));
    }

}
