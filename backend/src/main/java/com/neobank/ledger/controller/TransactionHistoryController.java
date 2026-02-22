package com.neobank.ledger.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.ledger.dto.LedgerEntryResponse;
import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.repository.LedgerRepository;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.service.WalletService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/transactions")
public class TransactionHistoryController {

    private final LedgerRepository ledgerRepository;
    private final WalletService walletService;

    public TransactionHistoryController(LedgerRepository ledgerRepository, WalletService walletService) {
        this.ledgerRepository = ledgerRepository;
        this.walletService = walletService;
    }

    @GetMapping("/history")
    public List<LedgerEntryResponse> history(@AuthenticationPrincipal AuthPrincipal principal) {
        Wallet wallet = walletService.getByUserId(principal.getUserId());
        List<LedgerEntry> entries = ledgerRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
        return entries.stream()
                .map(e -> new LedgerEntryResponse(
                        e.getId(),
                        e.getAmount(),
                        e.getDirection(),
                        e.getTxnType(),
                        e.getReferenceId(),
                        e.getDescription(),
                        e.getCreatedAt()
                ))
                .toList();
    }
}
