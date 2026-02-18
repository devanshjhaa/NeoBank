package com.neobank.topup.webhook;

import com.neobank.topup.service.TopupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/webhooks/topup")
public class TopupWebhookController {

    private final TopupService topupService;

    public TopupWebhookController(TopupService topupService) {
        this.topupService = topupService;
    }

    @PostMapping("/confirm")
    public ResponseEntity<Void> confirmTopup(
            @RequestParam Long userId,
            @RequestParam BigDecimal amount,
            @RequestParam String idempotencyKey,
            @RequestParam String gatewayRef
    ) {

        topupService.confirmTopup(
                userId,
                amount,
                idempotencyKey,
                gatewayRef
        );

        return ResponseEntity.ok().build();
    }
}
