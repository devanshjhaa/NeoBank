package com.neobank.admin.controller;

import com.neobank.admin.service.AdminService;
import com.neobank.user.entity.User;
import com.neobank.wallet.entity.Wallet;
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
    public List<User> users() {
        return adminService.listUsers();
    }

    @GetMapping("/wallets")
    public List<Wallet> wallets() {
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
