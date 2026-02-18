package com.neobank.admin.controller;

import com.neobank.admin.dto.UserSummary;
import com.neobank.admin.dto.WalletSummary;
import com.neobank.admin.service.AdminService;
import com.neobank.auth.security.AuthPrincipal;
import com.neobank.common.exception.ApiException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<UserSummary> users(@AuthenticationPrincipal AuthPrincipal principal) {
        requireAdmin(principal);
        return adminService.listUsers();
    }

    @GetMapping("/wallets")
    public List<WalletSummary> wallets(@AuthenticationPrincipal AuthPrincipal principal) {
        requireAdmin(principal);
        return adminService.listWallets();
    }

    @PostMapping("/wallets/{id}/freeze")
    public void freeze(@AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable Long id) {
        requireAdmin(principal);
        adminService.freezeWallet(id);
    }

    @PostMapping("/wallets/{id}/unfreeze")
    public void unfreeze(@AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable Long id) {
        requireAdmin(principal);
        adminService.unfreezeWallet(id);
    }

    private void requireAdmin(AuthPrincipal principal) {
        if (!"ADMIN".equals(principal.getTier())) {
            throw ApiException.forbidden("Admin access required");
        }
    }
}
