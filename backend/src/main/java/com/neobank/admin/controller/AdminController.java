package com.neobank.admin.controller;

import com.neobank.admin.dto.UserSummary;
import com.neobank.admin.dto.WalletSummary;
import com.neobank.admin.service.AdminService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<UserSummary> users() {
        return adminService.listUsers();
    }

    @GetMapping("/wallets")
    public List<WalletSummary> wallets() {
        return adminService.listWallets();
    }

    @PostMapping("/wallets/{id}/freeze")
    public void freeze(@PathVariable Long id) {
        adminService.freezeWallet(id);
    }

    @PostMapping("/wallets/{id}/unfreeze")
    public void unfreeze(@PathVariable Long id) {
        adminService.unfreezeWallet(id);
    }
}
