package com.neobank.payout.webhook;

import com.neobank.payout.service.PayoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhooks/payout")
public class PayoutWebhookController {

    private final PayoutService payoutService;

    public PayoutWebhookController(PayoutService payoutService) {
        this.payoutService = payoutService;
    }

    @PostMapping("/success")
    public ResponseEntity<Void> success(@RequestParam Long payoutId) {
        payoutService.confirmSuccess(payoutId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/fail")
    public ResponseEntity<Void> fail(@RequestParam Long payoutId) {
        payoutService.confirmFailure(payoutId);
        return ResponseEntity.ok().build();
    }
}
