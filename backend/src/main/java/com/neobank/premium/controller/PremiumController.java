package com.neobank.premium.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.premium.service.PremiumService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/premium")
public class PremiumController {

    private final PremiumService premiumService;

    public PremiumController(PremiumService premiumService) {
        this.premiumService = premiumService;
    }

    @PostMapping("/upgrade")
    public void upgrade(
            @AuthenticationPrincipal AuthPrincipal principal
    ) {
        premiumService.upgradeToPremium(principal.getUserId());
    }
}
