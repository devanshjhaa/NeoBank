package com.neobank.topup;

import com.neobank.auth.security.JwtProvider;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import com.neobank.wallet.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class TopupFlowTest {

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
        @Autowired
        WalletService walletService;
        @Autowired
        JwtProvider jwtProvider;

        @Test
        void confirmTopup_creditsWallet() throws Exception {

                User user = User.createWithEmail("topup@example.com", "hash");
                userRepository.save(user);
                walletService.createWalletIfAbsent(user.getId());
                walletService.creditWallet(user.getId(), new BigDecimal("100"));

                String token = jwtProvider.createToken(
                                user.getId(), user.getEmail(), user.getTier());

                mvc.perform(post("/topup/confirm")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"amount":250,"idempotencyKey":"topup-test-1","gatewayRef":"gw-ref-1"}
                                                """))
                                .andExpect(status().isOk());

                Wallet updated = walletRepository.findByUserId(user.getId()).orElseThrow();
                assertThat(updated.getBalance()).isEqualByComparingTo("350");
        }
}