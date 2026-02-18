package com.neobank.transfer.service;

import com.neobank.common.exception.ApiException;
import com.neobank.common.outbox.OutboxService;
import com.neobank.common.redis.RedisLockService;
import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.service.LedgerService;
import com.neobank.transfer.entity.Transaction;
import com.neobank.transfer.repository.TransactionRepository;
import com.neobank.wallet.service.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class TransferService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final LedgerService ledgerService;
    private final RedisLockService lockService;
    private final OutboxService outboxService;

    public TransferService(TransactionRepository transactionRepository,
            WalletService walletService,
            LedgerService ledgerService,
            RedisLockService lockService,
            OutboxService outboxService) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.ledgerService = ledgerService;
        this.lockService = lockService;
        this.outboxService = outboxService;
    }

    @Transactional
    public Transaction transfer(Long senderId,
            Long receiverId,
            BigDecimal amount,
            String idempotencyKey) {

        var existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent())
            return existing.get();

        if (senderId.equals(receiverId)) {
            throw ApiException.badRequest("SELF_TRANSFER", "Cannot transfer to yourself");
        }

        String lockKey = "wallet:lock:" + senderId;
        String ownerId = lockService.acquire(lockKey, Duration.ofSeconds(10));

        if (ownerId == null) {
            throw ApiException.locked("Wallet is currently being processed");
        }

        try {
            Transaction tx = Transaction.init(senderId, receiverId, amount, idempotencyKey);
            transactionRepository.save(tx);

            tx.markProcessing();

            Long senderWalletId = walletService.debitWallet(senderId, amount);
            Long receiverWalletId = walletService.creditWallet(receiverId, amount);

            String ref = UUID.randomUUID().toString();

            ledgerService.record(
                    LedgerEntry.debit(senderWalletId, amount, "P2P", ref, "Transfer out"));
            ledgerService.record(
                    LedgerEntry.credit(receiverWalletId, amount, "P2P", ref, "Transfer in"));

            tx.markSuccess();

            outboxService.save("TRANSFER_COMPLETED", Map.of(
                    "senderId", senderId,
                    "receiverId", receiverId,
                    "amount", amount.toPlainString()));

            return tx;

        } finally {
            lockService.release(lockKey, ownerId);
        }
    }
}
