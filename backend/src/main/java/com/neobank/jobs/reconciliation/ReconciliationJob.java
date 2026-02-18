package com.neobank.jobs.reconciliation;

import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class ReconciliationJob {

    private static final Logger log =
            LoggerFactory.getLogger(ReconciliationJob.class);

    private final WalletRepository walletRepository;
    private final EntityManager em;

    public ReconciliationJob(WalletRepository walletRepository,
                             EntityManager em) {
        this.walletRepository = walletRepository;
        this.em = em;
    }

    @Scheduled(cron = "0 0 * * * *") // hourly
    public void reconcile() {

        List<Wallet> wallets = walletRepository.findAll();

        for (Wallet wallet : wallets) {

            Query q = em.createQuery("""
                select coalesce(
                    sum(
                        case 
                          when l.direction='CREDIT' then l.amount 
                          else -l.amount 
                        end
                    ),0)
                from LedgerEntry l
                where l.walletId = :wid
            """);

            q.setParameter("wid", wallet.getId());

            BigDecimal ledgerSum = (BigDecimal) q.getSingleResult();

            if (ledgerSum.compareTo(wallet.getBalance()) != 0) {
                log.error(
                        "RECONCILIATION_MISMATCH walletId={} ledgerSum={} walletBalance={}",
                        wallet.getId(),
                        ledgerSum,
                        wallet.getBalance()
                );
            }
        }
    }
}
