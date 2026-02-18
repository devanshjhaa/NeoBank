package com.neobank.payout.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.payout.dto.PayoutRequest;
import com.neobank.payout.dto.PayoutResponse;
import com.neobank.payout.entity.Payout;
import com.neobank.payout.service.PayoutService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payout")
public class PayoutController {

    private final PayoutService payoutService;

    public PayoutController(PayoutService payoutService) {
        this.payoutService = payoutService;
    }

    @PostMapping
    public PayoutResponse requestPayout(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody PayoutRequest req) {
        Payout payout = payoutService.requestPayout(
                principal.getUserId(),
                req.bankAccountId(),
                req.amount(),
                req.idempotencyKey());

        return new PayoutResponse(
                payout.getId(),
                payout.getAmount(),
                payout.getStatus(),
                payout.getCreatedAt());
    }
}
