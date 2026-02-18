package com.neobank.payout.service;

import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.service.LedgerService;
import com.neobank.payout.entity.Payout;
import com.neobank.payout.repository.PayoutRepository;
import com.neobank.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final WalletService walletService;
    private final LedgerService ledgerService;

    public PayoutService(PayoutRepository payoutRepository,
                         WalletService walletService,
                         LedgerService ledgerService) {
        this.payoutRepository = payoutRepository;
        this.walletService = walletService;
        this.ledgerService = ledgerService;
    }

    @Transactional
    public Payout requestPayout(Long userId,
                                Long bankAccountId,
                                BigDecimal amount,
                                String idempotencyKey) {

        var existing = payoutRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) return existing.get();

        Payout payout = Payout.init(userId, bankAccountId, amount, idempotencyKey);
        payoutRepository.save(payout);

        payout.markProcessing();

        Long walletId = walletService.debitWallet(userId, amount);

        String ref = UUID.randomUUID().toString();

        ledgerService.record(
                LedgerEntry.debit(walletId, amount, "WITHDRAW", ref, "Bank payout")
        );

        return payout;
    }

    @Transactional
    public void confirmSuccess(Long payoutId) {
        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow();

        payout.markSuccess();
    }

    @Transactional
    public void confirmFailure(Long payoutId) {

        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow();

        payout.markFailed();

        Long walletId = walletService.creditWallet(
                payout.getUserId(),
                payout.getAmount()
        );

        String ref = UUID.randomUUID().toString();

        ledgerService.record(
                LedgerEntry.credit(walletId,
                        payout.getAmount(),
                        "REVERSAL",
                        ref,
                        "Payout failed reversal")
        );
    }
}
