package com.neobank.jobs.outbox;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OutboxPublisherJob {

    private static final Logger log =
            LoggerFactory.getLogger(OutboxPublisherJob.class);

    private final EntityManager em;

    public OutboxPublisherJob(EntityManager em) {
        this.em = em;
    }

    @Scheduled(fixedDelay = 5000)
    public void publish() {

        Query q = em.createNativeQuery("""
            select id, event_type, payload
            from outbox_events
            where published=false
            order by id
            limit 50
        """);

        List<Object[]> events = q.getResultList();

        for (Object[] row : events) {

            Long id = ((Number) row[0]).longValue();
            String type = (String) row[1];

            try {
                dispatch(type, row[2]);

                em.createNativeQuery("""
                    update outbox_events 
                    set published=true, published_at=now()
                    where id=:id
                """)
                .setParameter("id", id)
                .executeUpdate();

            } catch (Exception ex) {
                log.error("OUTBOX_DISPATCH_FAILED id={} type={}", id, type, ex);
            }
        }
    }

    private void dispatch(String type, Object payload) {
        // TODO: connect to Notification / Payout handlers
    }
}
