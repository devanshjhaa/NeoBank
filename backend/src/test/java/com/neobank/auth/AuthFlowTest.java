package com.neobank.auth;

import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestOtpConfig.class)
class AuthFlowTest {

        @Container
        @ServiceConnection
        static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

        @Container
        @ServiceConnection(name = "redis")
        static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);

        @Autowired
        MockMvc mvc;
        @Autowired
        UserRepository userRepository;
        @Autowired
        WalletRepository walletRepository;

        @Test
        void signup_thenVerifyOtp_createsWalletAndReturnsJwt() throws Exception {

                mvc.perform(post("/auth/signup")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"email":"authtest@example.com","password":"password123"}
                                                """))
                                .andExpect(status().isOk());

                var user = userRepository.findByEmail("authtest@example.com").orElseThrow();
                assertThat(user).isNotNull();

                mvc.perform(post("/auth/verify-otp")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"email":"%s","phone":"9999999999","otp":"123456"}
                                                """.formatted(user.getEmail())))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").isNotEmpty());

                var wallet = walletRepository.findByUserId(user.getId());
                assertThat(wallet).isPresent();
        }
}