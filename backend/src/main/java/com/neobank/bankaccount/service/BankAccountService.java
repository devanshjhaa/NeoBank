package com.neobank.bankaccount.service;

import com.neobank.bankaccount.entity.BankAccount;
import com.neobank.bankaccount.repository.BankAccountRepository;
import com.neobank.common.exception.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BankAccountService {

    private final BankAccountRepository bankAccountRepository;

    public BankAccountService(BankAccountRepository bankAccountRepository) {
        this.bankAccountRepository = bankAccountRepository;
    }

    @Transactional
    public BankAccount linkAccount(Long userId, String accountNumber, String ifscCode, String holderName) {
        boolean exists = bankAccountRepository
                .existsByUserIdAndAccountNumberAndIfscCode(userId, accountNumber, ifscCode.toUpperCase());
        if (exists) {
            throw ApiException.conflict("ACCOUNT_ALREADY_LINKED",
                    "This bank account is already linked to your profile");
        }

        BankAccount account = BankAccount.create(userId, accountNumber, ifscCode, holderName);

        account.markVerified();

        return bankAccountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public List<BankAccount> getUserAccounts(Long userId) {
        return bankAccountRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public BankAccount getUserAccount(Long userId, Long accountId) {
        return bankAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound(
                        "Bank account not found or does not belong to you"));
    }

    @Transactional
    public void deleteAccount(Long userId, Long accountId) {
        BankAccount account = bankAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound(
                        "Bank account not found or does not belong to you"));
        bankAccountRepository.delete(account);
    }
}
