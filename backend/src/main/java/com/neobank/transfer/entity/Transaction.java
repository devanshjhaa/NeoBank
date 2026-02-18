package com.neobank.transfer.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "transactions")
public class Transaction extends BaseEntity {

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    public static Transaction init(Long senderId,
                                   Long receiverId,
                                   BigDecimal amount,
                                   String idempotencyKey) {
        Transaction t = new Transaction();
        t.senderId = senderId;
        t.receiverId = receiverId;
        t.amount = amount;
        t.status = "INIT";
        t.idempotencyKey = idempotencyKey;
        return t;
    }

    public void markProcessing() {
        this.status = "PROCESSING";
    }

    public void markSuccess() {
        this.status = "SUCCESS";
    }
}
