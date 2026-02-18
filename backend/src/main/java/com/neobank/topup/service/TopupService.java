package com.neobank.topup.service;

import com.neobank.common.outbox.OutboxService;
import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.service.LedgerService;
import com.neobank.topup.entity.Topup;
import com.neobank.topup.repository.TopupRepository;
import com.neobank.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
public class TopupService {

    private final TopupRepository topupRepository;
    private final WalletService walletService;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;

    public TopupService(TopupRepository topupRepository,
            WalletService walletService,
            LedgerService ledgerService,
            OutboxService outboxService) {
        this.topupRepository = topupRepository;
        this.walletService = walletService;
        this.ledgerService = ledgerService;
        this.outboxService = outboxService;
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

        ledgerService.record(
                LedgerEntry.credit(walletId, amount, "TOPUP", ref, "Wallet top-up"));

        topup.markSuccess(gatewayRef);

        outboxService.save("TOPUP_COMPLETED", Map.of(
                "userId", userId,
                "amount", amount.toPlainString()));

        return topup;
    }
}
