package com.neobank.bankaccount.service;

import com.neobank.bankaccount.entity.BankAccount;
import com.neobank.bankaccount.repository.BankAccountRepository;
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
            throw new IllegalStateException("This bank account is already linked");
        }

        BankAccount account = BankAccount.create(userId, accountNumber, ifscCode, holderName);

        // Sandbox auto-verification: in test mode all accounts are auto-verified
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
                .orElseThrow(() -> new IllegalArgumentException("Bank account not found"));
    }

    @Transactional
    public void deleteAccount(Long userId, Long accountId) {
        BankAccount account = bankAccountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Bank account not found"));
        bankAccountRepository.delete(account);
    }
}
