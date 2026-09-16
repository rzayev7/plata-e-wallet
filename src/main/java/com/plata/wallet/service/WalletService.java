package com.plata.wallet.service;

import com.plata.customer.entity.Customer;
import com.plata.wallet.entity.Wallet;
import java.util.UUID;

public interface WalletService {
    Wallet createWallet(Customer customer);
}
