package com.neobank.common.outbox;

import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class OutboxService {

    private final EntityManager em;

    public OutboxService(EntityManager em) {
        this.em = em;
    }

    public void save(String eventType, Map<String, Object> payload) {
        em.createNativeQuery("""
                    INSERT INTO outbox_events (event_type, payload, published, created_at)
                    VALUES (:type, cast(:payload as jsonb), false, now())
                """)
                .setParameter("type", eventType)
                .setParameter("payload", toJson(payload))
                .executeUpdate();
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        int i = 0;
        for (var entry : map.entrySet()) {
            if (i++ > 0)
                sb.append(",");
            sb.append("\"").append(entry.getKey()).append("\":");
            Object val = entry.getValue();
            if (val instanceof Number) {
                sb.append(val);
            } else {
                sb.append("\"").append(val).append("\"");
            }
        }
        sb.append("}");
        return sb.toString();
    }
}
