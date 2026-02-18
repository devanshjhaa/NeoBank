package com.neobank.topup.service;

import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.service.LedgerService;
import com.neobank.topup.entity.Topup;
import com.neobank.topup.repository.TopupRepository;
import com.neobank.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class TopupService {

    private final TopupRepository topupRepository;
    private final WalletService walletService;
    private final LedgerService ledgerService;

    public TopupService(TopupRepository topupRepository,
                        WalletService walletService,
                        LedgerService ledgerService) {
        this.topupRepository = topupRepository;
        this.walletService = walletService;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public Topup confirmTopup(Long userId,
                              BigDecimal amount,
                              String idempotencyKey,
                              String gatewayRef) {

        var existing = topupRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        Topup topup = Topup.createInit(userId, amount, idempotencyKey);
        topupRepository.save(topup);

        Long walletId = walletService.creditWallet(userId, amount);

        String ref = UUID.randomUUID().toString();

        LedgerEntry entry = LedgerEntry.credit(
                walletId,
                amount,
                "TOPUP",
                ref,
                "Wallet top-up"
        );

        ledgerService.record(entry);

        topup.markSuccess(gatewayRef);

        return topup;
    }
}
