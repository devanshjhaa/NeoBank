package com.neobank.admin.service;

import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public AdminService(UserRepository userRepository,
                        WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    public List<User> listUsers() {
        return userRepository.findAll();
    }

    public List<Wallet> listWallets() {
        return walletRepository.findAll();
    }

    @Transactional
    public void freezeWallet(Long walletId) {

        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow();

        wallet.freeze();
    }

    @Transactional
    public void unfreezeWallet(Long walletId) {

        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow();

        wallet.activate();
    }
}
