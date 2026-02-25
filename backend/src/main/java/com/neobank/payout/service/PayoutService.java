package com.neobank.payout.service;

import com.neobank.bankaccount.entity.BankAccount;
import com.neobank.bankaccount.service.BankAccountService;
import com.neobank.common.exception.ApiException;
import com.neobank.common.outbox.OutboxService;
import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.service.LedgerService;
import com.neobank.payout.entity.Payout;
import com.neobank.payout.repository.PayoutRepository;
import com.neobank.wallet.service.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
public class PayoutService {

        private static final Logger log = LoggerFactory.getLogger(PayoutService.class);

        private final PayoutRepository payoutRepository;
        private final WalletService walletService;
        private final LedgerService ledgerService;
        private final OutboxService outboxService;
        private final BankAccountService bankAccountService;

        public PayoutService(PayoutRepository payoutRepository,
                        WalletService walletService,
                        LedgerService ledgerService,
                        OutboxService outboxService,
                        BankAccountService bankAccountService) {
                this.payoutRepository = payoutRepository;
                this.walletService = walletService;
                this.ledgerService = ledgerService;
                this.outboxService = outboxService;
                this.bankAccountService = bankAccountService;
        }

        @Transactional
        public Payout requestPayout(Long userId,
                        Long bankAccountId,
                        BigDecimal amount,
                        String idempotencyKey) {

                var existing = payoutRepository.findByIdempotencyKey(idempotencyKey);
                if (existing.isPresent())
                        return existing.get();

                BankAccount bankAccount = bankAccountService.getUserAccount(userId, bankAccountId);
                if (!bankAccount.isVerified()) {
                        throw ApiException.badRequest("ACCOUNT_NOT_VERIFIED",
                                        "Bank account is not verified yet");
                }

                Payout payout = Payout.init(userId, bankAccountId, amount, idempotencyKey);
                payoutRepository.save(payout);

                payout.markProcessing();

                Long walletId = walletService.debitWallet(userId, amount);

                String ref = UUID.randomUUID().toString();

                ledgerService.record(
                                LedgerEntry.debit(walletId, amount, "WITHDRAW", ref, "Bank payout"));

                outboxService.save("PAYOUT_REQUESTED", Map.of(
                                "payoutId", payout.getId(),
                                "userId", userId,
                                "amount", amount.toPlainString()));

                return payout;
        }

        @Transactional
        public void confirmSuccess(Long payoutId) {
                Payout payout = payoutRepository.findById(payoutId)
                                .orElseThrow(() -> ApiException.notFound(
                                                "Payout not found: " + payoutId));

                if (!"PROCESSING".equals(payout.getStatus())) {
                        log.warn("confirmSuccess skipped — payout {} already in state {}",
                                        payoutId, payout.getStatus());
                        return;
                }

                payout.markSuccess();

                outboxService.save("PAYOUT_COMPLETED", Map.of(
                                "payoutId", payoutId,
                                "userId", payout.getUserId(),
                                "amount", payout.getAmount().toPlainString(),
                                "result", "SUCCESS"));
        }

        @Transactional
        public void confirmFailure(Long payoutId) {
                Payout payout = payoutRepository.findById(payoutId)
                                .orElseThrow(() -> ApiException.notFound(
                                                "Payout not found: " + payoutId));

                if (!"PROCESSING".equals(payout.getStatus())) {
                        log.warn("confirmFailure skipped — payout {} already in state {}",
                                        payoutId, payout.getStatus());
                        return;
                }

                payout.markFailed();

                Long walletId = walletService.creditWallet(
                                payout.getUserId(),
                                payout.getAmount());

                String ref = UUID.randomUUID().toString();

                ledgerService.record(
                                LedgerEntry.credit(walletId,
                                                payout.getAmount(),
                                                "REVERSAL",
                                                ref,
                                                "Payout failed reversal"));

                outboxService.save("PAYOUT_COMPLETED", Map.of(
                                "payoutId", payoutId,
                                "userId", payout.getUserId(),
                                "amount", payout.getAmount().toPlainString(),
                                "result", "FAILED"));
        }
}
