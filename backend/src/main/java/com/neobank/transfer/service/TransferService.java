package com.neobank.transfer.service;

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
import java.util.UUID;

@Service
public class TransferService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final LedgerService ledgerService;
    private final RedisLockService lockService;

    public TransferService(TransactionRepository transactionRepository,
                           WalletService walletService,
                           LedgerService ledgerService,
                           RedisLockService lockService) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.ledgerService = ledgerService;
        this.lockService = lockService;
    }

    @Transactional
    public Transaction transfer(Long senderId,
                                Long receiverId,
                                BigDecimal amount,
                                String idempotencyKey) {

        var existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) return existing.get();

        String lockKey = "wallet:lock:" + senderId;

        if (!lockService.acquire(lockKey, Duration.ofSeconds(10))) {
            throw new RuntimeException("Wallet locked");
        }

        try {
            Transaction tx = Transaction.init(senderId, receiverId, amount, idempotencyKey);
            transactionRepository.save(tx);

            tx.markProcessing();

            Long senderWalletId = walletService.debitWallet(senderId, amount);

            Long receiverWalletId = walletService.creditWallet(receiverId, amount);

            String ref = UUID.randomUUID().toString();

            ledgerService.record(
                    LedgerEntry.debit(senderWalletId, amount, "P2P", ref, "Transfer out")
            );

            ledgerService.record(
                    LedgerEntry.credit(receiverWalletId, amount, "P2P", ref, "Transfer in")
            );

            tx.markSuccess();

            return tx;

        } finally {
            lockService.release(lockKey);
        }
    }
}
