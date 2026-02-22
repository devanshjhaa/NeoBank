package com.neobank.user.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "auth_provider", nullable = false)
    private String authProvider = "LOCAL";

    @Column(name = "provider_id")
    private String providerId;

    @Column(unique = true)
    private String phone;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified = false;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(nullable = false)
    private String tier = "FREE";

    public static User createWithEmail(String email, String passwordHash) {
        User user = new User();
        user.email = email;
        user.passwordHash = passwordHash;
        user.authProvider = "LOCAL";
        return user;
    }

    public static User createWithGoogle(String email, String providerId) {
        User user = new User();
        user.email = email;
        user.authProvider = "GOOGLE";
        user.providerId = providerId;
        return user;
    }

    public void verifyPhone(String phone) {
        this.phone = phone;
        this.phoneVerified = true;
    }

    public void suspend() {
        this.status = "SUSPENDED";
    }

    public void activate() {
        this.status = "ACTIVE";
    }

    public void upgradeToPremium() {
        this.tier = "PREMIUM";
    }

    public boolean isActive() {
        return "ACTIVE".equals(this.status);
    }
}
