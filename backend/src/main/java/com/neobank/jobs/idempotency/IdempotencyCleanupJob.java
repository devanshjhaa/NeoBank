package com.neobank.jobs.idempotency;

import jakarta.persistence.EntityManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class IdempotencyCleanupJob {

    private final EntityManager em;

    public IdempotencyCleanupJob(EntityManager em) {
        this.em = em;
    }

    @Scheduled(cron = "0 0 2 * * *") // daily 2 AM
    public void cleanup() {

        Instant cutoffInstant = Instant.now().minus(7, ChronoUnit.DAYS);
        Timestamp cutoff = Timestamp.from(cutoffInstant);

        em.createNativeQuery("""
            delete from idempotency_keys
            where created_at < :cutoff
        """)
        .setParameter("cutoff", cutoff)
        .executeUpdate();
    }
}
