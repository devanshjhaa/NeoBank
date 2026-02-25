package com.neobank.wallet.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.common.exception.ApiException;
import com.neobank.wallet.dto.WalletResponse;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wallet")
@PreAuthorize("hasRole('USER')")
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
                .orElseThrow(() -> ApiException.notFound(
                        "Wallet not found for your account"));

        return new WalletResponse(
                wallet.getId(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getStatus()
        );
    }
}
