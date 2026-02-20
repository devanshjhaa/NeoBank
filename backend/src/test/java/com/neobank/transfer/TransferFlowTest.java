package com.neobank.transfer;

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
class TransferFlowTest {

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
        void transfer_movesFundsBetweenWallets() throws Exception {

                User sender = User.createWithEmail("sender@example.com", "hash");
                userRepository.save(sender);
                walletService.createWalletIfAbsent(sender.getId());
                walletService.creditWallet(sender.getId(), new BigDecimal("1000"));

                User receiver = User.createWithEmail("receiver@example.com", "hash");
                userRepository.save(receiver);
                walletService.createWalletIfAbsent(receiver.getId());
                walletService.creditWallet(receiver.getId(), new BigDecimal("100"));

                String token = jwtProvider.createToken(
                                sender.getId(), sender.getEmail(), sender.getTier());

                mvc.perform(post("/transfer")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"receiverId":%d,"amount":200,"idempotencyKey":"tx-test-1"}
                                                """.formatted(receiver.getId())))
                                .andExpect(status().isOk());

                Wallet updatedSender = walletRepository.findByUserId(sender.getId()).orElseThrow();
                Wallet updatedReceiver = walletRepository.findByUserId(receiver.getId()).orElseThrow();

                assertThat(updatedSender.getBalance()).isEqualByComparingTo("800");
                assertThat(updatedReceiver.getBalance()).isEqualByComparingTo("300");
        }
}