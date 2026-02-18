package com.neobank.wallet.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "wallets")
public class Wallet extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(nullable = false)
    private String status = "ACTIVE";

    public static Wallet createForUser(Long userId) {
        Wallet wallet = new Wallet();
        wallet.userId = userId;
        wallet.balance = BigDecimal.ZERO;
        wallet.currency = "INR";
        wallet.status = "ACTIVE";
        return wallet;
    }

    public void credit(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }

    public void debit(BigDecimal amount) {
        this.balance = this.balance.subtract(amount);
    }

    public boolean hasSufficientBalance(BigDecimal amount) {
        return this.balance.compareTo(amount) >= 0;
    }

    public void freeze() {
        this.status = "FROZEN";
    }

    public void activate() {
        this.status = "ACTIVE";
    }

    public boolean isActive() {
        return "ACTIVE".equals(this.status);
    }
}
