package com.neobank.payout;

import com.neobank.auth.security.JwtProvider;
import com.neobank.payout.repository.PayoutRepository;
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
import org.springframework.jdbc.core.JdbcTemplate;
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
class PayoutFlowTest {

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
        PayoutRepository payoutRepository;
        @Autowired
        JwtProvider jwtProvider;
        @Autowired
        JdbcTemplate jdbcTemplate;

        @Test
        void requestPayout_debitsWallet_andCreatesPayout() throws Exception {

                User user = User.createWithEmail("payout@example.com", "hash");
                userRepository.save(user);
                walletService.createWalletIfAbsent(user.getId());
                walletService.creditWallet(user.getId(), new BigDecimal("1000"));

                Long bankAccountId = jdbcTemplate.queryForObject(
                                "INSERT INTO bank_accounts (user_id, account_number, ifsc_code, holder_name) " +
                                                "VALUES (?, '1234567890', 'SBIN0001234', 'Test User') RETURNING id",
                                Long.class,
                                user.getId());

                String token = jwtProvider.createToken(
                                user.getId(), user.getEmail(), user.getTier());

                mvc.perform(post("/payout")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"bankAccountId":%d,"amount":300,"idempotencyKey":"payout-test-1"}
                                                """.formatted(bankAccountId)))
                                .andExpect(status().isOk());

                Wallet updated = walletRepository.findByUserId(user.getId()).orElseThrow();
                assertThat(updated.getBalance()).isEqualByComparingTo("700");

                assertThat(payoutRepository.findAll()).isNotEmpty();
        }
}