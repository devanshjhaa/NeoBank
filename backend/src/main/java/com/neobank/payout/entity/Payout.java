package com.neobank.payout.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "payouts")
public class Payout extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "bank_account_id", nullable = false)
    private Long bankAccountId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    public static Payout init(Long userId,
                              Long bankAccountId,
                              BigDecimal amount,
                              String idempotencyKey) {
        Payout p = new Payout();
        p.userId = userId;
        p.bankAccountId = bankAccountId;
        p.amount = amount;
        p.status = "INIT";
        p.idempotencyKey = idempotencyKey;
        return p;
    }

    public void markProcessing() {
        this.status = "PROCESSING";
    }

    public void markSuccess() {
        this.status = "SUCCESS";
    }

    public void markFailed() {
        this.status = "FAILED";
    }
}
