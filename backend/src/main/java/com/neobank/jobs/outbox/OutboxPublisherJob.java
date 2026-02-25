package com.neobank.jobs.outbox;

import com.neobank.notification.service.NotificationService;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class OutboxPublisherJob {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisherJob.class);
    private static final int MAX_RETRIES = 5;

    private final EntityManager em;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public OutboxPublisherJob(EntityManager em,
            NotificationService notificationService,
            UserRepository userRepository) {
        this.em = em;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void publish() {

        Query q = em.createNativeQuery("""
                    SELECT id, event_type, payload::text, retry_count
                    FROM outbox_events
                    WHERE published = false
                      AND retry_count < :maxRetries
                    ORDER BY id
                    LIMIT 50
                """);
        q.setParameter("maxRetries", MAX_RETRIES);

        @SuppressWarnings("unchecked")
        List<Object[]> events = q.getResultList();

        for (Object[] row : events) {

            Long id = ((Number) row[0]).longValue();
            String type = (String) row[1];
            String payload = (String) row[2];

            try {
                dispatch(type, payload);

                em.createNativeQuery("""
                            UPDATE outbox_events
                            SET published = true, published_at = now()
                            WHERE id = :id
                        """)
                        .setParameter("id", id)
                        .executeUpdate();

            } catch (Exception ex) {
                log.error("OUTBOX_DISPATCH_FAILED id={} type={}", id, type, ex);

                em.createNativeQuery("""
                            UPDATE outbox_events
                            SET retry_count = retry_count + 1
                            WHERE id = :id
                        """)
                        .setParameter("id", id)
                        .executeUpdate();
            }
        }
    }

    private void dispatch(String type, String payload) {
        Long userId = extractLong(payload, "userId");
        String amount = extractString(payload, "amount");

        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return;

        String email = user.getEmail();

        switch (type) {
            case "TOPUP_COMPLETED" -> notificationService.topupSuccess(email, user.getPhone(), amount);
            case "TRANSFER_COMPLETED" -> notificationService.transferSent(email, amount);
            case "PAYOUT_REQUESTED" -> notificationService.payoutRequested(email, amount);
            case "PAYOUT_COMPLETED" -> {
                String result = extractString(payload, "result");
                if ("SUCCESS".equals(result)) {
                    notificationService.payoutSuccess(email, amount);
                } else {
                    notificationService.payoutFailed(email, amount);
                }
            }
            default -> log.warn("Unknown event type: {}", type);
        }
    }

    private Long extractLong(String json, String key) {
        String val = extractString(json, key);
        return val != null ? Long.valueOf(val) : null;
    }

    private String extractString(String json, String key) {
        String search = "\"" + key + "\":";
        int start = json.indexOf(search);
        if (start < 0)
            return null;
        start += search.length();
        if (json.charAt(start) == '"') {
            start++;
            int end = json.indexOf('"', start);
            return json.substring(start, end);
        }
        int end = json.indexOf(',', start);
        if (end < 0)
            end = json.indexOf('}', start);
        return json.substring(start, end).trim();
    }
}
