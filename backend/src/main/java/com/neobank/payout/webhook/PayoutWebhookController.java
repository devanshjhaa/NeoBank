package com.neobank.payout.webhook;

import com.neobank.common.security.WebhookSignatureVerifier;
import com.neobank.payout.service.PayoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhooks/payout")
public class PayoutWebhookController {

    private final PayoutService payoutService;
    private final WebhookSignatureVerifier signatureVerifier;

    public PayoutWebhookController(PayoutService payoutService,
                                   WebhookSignatureVerifier signatureVerifier) {
        this.payoutService = payoutService;
        this.signatureVerifier = signatureVerifier;
    }

    @PostMapping("/success")
    public ResponseEntity<Void> success(
            @RequestParam Long payoutId,
            @RequestHeader("X-Webhook-Signature") String signature) {
        signatureVerifier.verify(String.valueOf(payoutId), signature);
        payoutService.confirmSuccess(payoutId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/fail")
    public ResponseEntity<Void> fail(
            @RequestParam Long payoutId,
            @RequestHeader("X-Webhook-Signature") String signature) {
        signatureVerifier.verify(String.valueOf(payoutId), signature);
        payoutService.confirmFailure(payoutId);
        return ResponseEntity.ok().build();
    }
}
