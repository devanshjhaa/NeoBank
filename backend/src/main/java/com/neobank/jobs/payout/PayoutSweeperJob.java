package com.neobank.jobs.payout;

import com.neobank.payout.entity.Payout;
import com.neobank.payout.repository.PayoutRepository;
import com.neobank.payout.service.PayoutService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class PayoutSweeperJob {

    private static final Logger log = LoggerFactory.getLogger(PayoutSweeperJob.class);

    private final PayoutRepository payoutRepository;
    private final PayoutService payoutService;

    public PayoutSweeperJob(PayoutRepository payoutRepository,
            PayoutService payoutService) {
        this.payoutRepository = payoutRepository;
        this.payoutService = payoutService;
    }

    @Scheduled(fixedDelay = 900000)
    public void sweep() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.MINUTES);

        List<Payout> stuck = payoutRepository.findStuckProcessing(cutoff);

        for (Payout p : stuck) {
            log.warn("Sweeping stuck payout id={}", p.getId());
            payoutService.confirmFailure(p.getId());
        }
    }
}
