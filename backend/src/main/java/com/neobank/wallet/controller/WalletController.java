package com.neobank.wallet.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.wallet.dto.WalletResponse;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wallet")
public class WalletController {

    private final WalletRepository walletRepository;

    public WalletController(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    @GetMapping("/me")
    public WalletResponse myWallet(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {

        Wallet wallet = walletRepository
                .findByUserId(principal.getUserId())
                .orElseThrow();

        return new WalletResponse(
                wallet.getId(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getStatus()
        );
    }
}
