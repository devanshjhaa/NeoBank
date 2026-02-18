package com.neobank.ledger.service;

import com.neobank.ledger.entity.LedgerEntry;
import com.neobank.ledger.repository.LedgerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LedgerService {

    private final LedgerRepository ledgerRepository;

    public LedgerService(LedgerRepository ledgerRepository) {
        this.ledgerRepository = ledgerRepository;
    }

    @Transactional
    public LedgerEntry record(LedgerEntry entry) {
        return ledgerRepository.save(entry);
    }
}
