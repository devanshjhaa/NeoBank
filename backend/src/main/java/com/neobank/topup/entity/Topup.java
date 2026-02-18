package com.neobank.topup.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "topups")
public class Topup extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status;

    @Column(name = "gateway_ref", unique = true)
    private String gatewayRef;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    public static Topup createInit(Long userId, BigDecimal amount, String idempotencyKey) {
        Topup t = new Topup();
        t.userId = userId;
        t.amount = amount;
        t.status = "INIT";
        t.idempotencyKey = idempotencyKey;
        return t;
    }

    public void markSuccess(String gatewayRef) {
        this.status = "SUCCESS";
        this.gatewayRef = gatewayRef;
    }
}
