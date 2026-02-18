package com.neobank.user.service;

import com.neobank.common.exception.ApiException;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }

    public User getByPhone(String phone) {
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> ApiException.notFound("User not found"));
    }
}
