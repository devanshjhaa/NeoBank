package com.neobank.wallet.service;

import com.neobank.common.exception.ApiException;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class WalletService {

    private final WalletRepository walletRepository;

    public WalletService(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @Transactional
    public void createWalletIfAbsent(Long userId) {
        if (walletRepository.findByUserId(userId).isPresent()) {
            return;
        }
        walletRepository.save(Wallet.createForUser(userId));
    }

    @Transactional
    public Long creditWallet(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Wallet not found"));

        if (!wallet.isActive()) {
            throw ApiException.badRequest("WALLET_FROZEN", "Wallet is frozen");
        }

        wallet.credit(amount);
        return wallet.getId();
    }

    @Transactional
    public Long debitWallet(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Wallet not found"));

        if (!wallet.isActive()) {
            throw ApiException.badRequest("WALLET_FROZEN", "Wallet is frozen");
        }

        if (!wallet.hasSufficientBalance(amount)) {
            throw ApiException.badRequest("INSUFFICIENT_BALANCE",
                    "Balance " + wallet.getBalance() + " is less than " + amount);
        }

        wallet.debit(amount);
        return wallet.getId();
    }

    public Wallet getByUserId(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Wallet not found"));
    }
}
