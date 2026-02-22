package com.neobank.bankaccount.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "bank_accounts")
public class BankAccount extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @Column(name = "ifsc_code", nullable = false)
    private String ifscCode;

    @Column(name = "holder_name", nullable = false)
    private String holderName;

    @Column(nullable = false)
    private boolean verified;

    public static BankAccount create(Long userId, String accountNumber, String ifscCode, String holderName) {
        BankAccount ba = new BankAccount();
        ba.userId = userId;
        ba.accountNumber = accountNumber;
        ba.ifscCode = ifscCode.toUpperCase();
        ba.holderName = holderName;
        ba.verified = false;
        return ba;
    }

    public void markVerified() {
        this.verified = true;
    }

    public String maskedAccountNumber() {
        if (accountNumber.length() <= 4) return "****";
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }
}
