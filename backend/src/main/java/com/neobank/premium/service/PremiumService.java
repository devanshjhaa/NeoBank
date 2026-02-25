package com.neobank.premium.service;

import com.neobank.common.exception.ApiException;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PremiumService {

    private final UserRepository userRepository;

    public PremiumService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void upgradeToPremium(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!user.isActive()) {
            throw ApiException.badRequest("ACCOUNT_SUSPENDED",
                    "Your account is suspended and cannot be upgraded");
        }

        if ("PREMIUM".equals(user.getTier())) {
            return;
        }

        user.upgradeToPremium();
    }
}
