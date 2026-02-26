package com.neobank.user.entity;

import com.neobank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    private static final String[] AVATAR_EMOJIS = {
        "\uD83E\uDDD1\u200D\uD83D\uDCBC", "\uD83E\uDDD1\u200D\uD83D\uDCBB", "\uD83E\uDDD1\u200D\uD83C\uDF93",
        "\uD83E\uDDD1\u200D\uD83D\uDD2C", "\uD83E\uDDD1\u200D\uD83C\uDFA8", "\uD83E\uDDD1\u200D\uD83D\uDE80",
        "\uD83E\uDDD1\u200D\u2695\uFE0F", "\uD83E\uDDD1\u200D\uD83D\uDD27", "\uD83E\uDDD1\u200D\uD83C\uDF73",
        "\uD83E\uDDD1\u200D\uD83C\uDFEB", "\uD83E\uDDB8", "\uD83E\uDDD9", "\uD83E\uDDD4", "\uD83E\uDDD3",
        "\uD83D\uDE0E", "\uD83E\uDD13", "\uD83E\uDD78", "\uD83D\uDC7D", "\uD83E\uDD16", "\uD83E\uDDCA"
    };

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

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "avatar_emoji", length = 10)
    private String avatarEmoji;

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

    public void verifyPhone(String phone, String fullName, LocalDate dateOfBirth) {
        this.phone = phone;
        this.phoneVerified = true;
        if (fullName != null && !fullName.isBlank()) {
            this.fullName = fullName.trim();
        }
        if (dateOfBirth != null) {
            this.dateOfBirth = dateOfBirth;
        }
        if (this.avatarEmoji == null && this.getId() != null) {
            this.avatarEmoji = AVATAR_EMOJIS[(int) (this.getId() % AVATAR_EMOJIS.length)];
        }
    }

    public void assignAvatarIfMissing() {
        if (this.avatarEmoji == null && this.getId() != null) {
            this.avatarEmoji = AVATAR_EMOJIS[(int) (this.getId() % AVATAR_EMOJIS.length)];
        }
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
