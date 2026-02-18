package com.neobank.admin.service;

import com.neobank.admin.dto.UserSummary;
import com.neobank.admin.dto.WalletSummary;
import com.neobank.common.exception.ApiException;
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

    public List<UserSummary> listUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserSummary(
                        u.getId(), u.getEmail(), u.getPhone(),
                        u.isPhoneVerified(), u.getStatus(), u.getTier(),
                        u.getCreatedAt()))
                .toList();
    }

    public List<WalletSummary> listWallets() {
        return walletRepository.findAll().stream()
                .map(w -> new WalletSummary(
                        w.getId(), w.getUserId(), w.getBalance(),
                        w.getCurrency(), w.getStatus(), w.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void freezeWallet(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> ApiException.notFound("Wallet not found"));
        wallet.freeze();
    }

    @Transactional
    public void unfreezeWallet(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> ApiException.notFound("Wallet not found"));
        wallet.activate();
    }
}
