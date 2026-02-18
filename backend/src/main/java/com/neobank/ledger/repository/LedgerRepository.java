package com.neobank.ledger.repository;

import com.neobank.ledger.entity.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerRepository extends JpaRepository<LedgerEntry, Long> {
}
