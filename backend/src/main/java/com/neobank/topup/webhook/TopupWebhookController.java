package com.neobank.topup.webhook;

import com.neobank.common.security.WebhookSignatureVerifier;
import com.neobank.topup.service.TopupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/webhooks/topup")
public class TopupWebhookController {

    private final TopupService topupService;
    private final WebhookSignatureVerifier signatureVerifier;

    public TopupWebhookController(TopupService topupService,
                                  WebhookSignatureVerifier signatureVerifier) {
        this.topupService = topupService;
        this.signatureVerifier = signatureVerifier;
    }

    @PostMapping("/confirm")
    public ResponseEntity<Void> confirmTopup(
            @RequestParam Long userId,
            @RequestParam BigDecimal amount,
            @RequestParam String idempotencyKey,
            @RequestParam String gatewayRef,
            @RequestHeader("X-Webhook-Signature") String signature
    ) {
        String payload = userId + ":" + amount.toPlainString() + ":" + idempotencyKey + ":" + gatewayRef;
        signatureVerifier.verify(payload, signature);

        topupService.confirmTopup(userId, amount, idempotencyKey, gatewayRef);

        return ResponseEntity.ok().build();
    }
}
