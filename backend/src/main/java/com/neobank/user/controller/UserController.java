package com.neobank.user.controller;

import com.neobank.auth.security.AuthPrincipal;
import com.neobank.user.dto.UserProfileResponse;
import com.neobank.user.entity.User;
import com.neobank.user.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('USER')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        User user = userService.getById(principal.getUserId());
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.isPhoneVerified(),
                user.getStatus(),
                user.getTier(),
                user.getAuthProvider(),
                user.getFullName(),
                user.getDateOfBirth(),
                user.getAvatarEmoji(),
                user.getCreatedAt()
        );
    }
}
