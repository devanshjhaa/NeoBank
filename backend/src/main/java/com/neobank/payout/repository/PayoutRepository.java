package com.neobank.payout.repository;

import com.neobank.payout.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PayoutRepository extends JpaRepository<Payout, Long> {

    Optional<Payout> findByIdempotencyKey(String key);

    @Query("SELECT p FROM Payout p WHERE p.status = 'PROCESSING' AND p.createdAt < :cutoff")
    List<Payout> findStuckProcessing(Instant cutoff);
}
