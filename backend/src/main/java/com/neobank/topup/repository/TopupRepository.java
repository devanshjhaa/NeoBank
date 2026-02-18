package com.neobank.topup.repository;

import com.neobank.topup.entity.Topup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TopupRepository extends JpaRepository<Topup, Long> {

    Optional<Topup> findByIdempotencyKey(String key);
}
