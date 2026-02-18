package com.neobank.ledger.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "ledger_entries")
public class LedgerEntry extends BaseEntity {

    @Column(name = "wallet_id", nullable = false)
    private Long walletId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String direction; // CREDIT or DEBIT

    @Column(name = "txn_type", nullable = false)
    private String txnType;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Column
    private String description;

    // ===== Factory methods =====

    public static LedgerEntry credit(
            Long walletId,
            BigDecimal amount,
            String txnType,
            String referenceId,
            String description
    ) {
        LedgerEntry e = new LedgerEntry();
        e.walletId = walletId;
        e.amount = amount;
        e.direction = "CREDIT";
        e.txnType = txnType;
        e.referenceId = referenceId;
        e.description = description;
        return e;
    }

    public static LedgerEntry debit(
            Long walletId,
            BigDecimal amount,
            String txnType,
            String referenceId,
            String description
    ) {
        LedgerEntry e = new LedgerEntry();
        e.walletId = walletId;
        e.amount = amount;
        e.direction = "DEBIT";
        e.txnType = txnType;
        e.referenceId = referenceId;
        e.description = description;
        return e;
    }
}
