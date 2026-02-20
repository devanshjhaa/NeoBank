package com.neobank.wallet;

import com.neobank.auth.security.JwtProvider;
import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import com.neobank.wallet.entity.Wallet;
import com.neobank.wallet.repository.WalletRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.MockMvc;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class WalletFlowTest {

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
        JwtProvider jwtProvider;

        @Test
        void walletMe_returnsOwnWallet() throws Exception {

                User user = User.createWithEmail("wallettest@example.com", "hash");
                userRepository.save(user);

                Wallet wallet = Wallet.createForUser(user.getId());
                walletRepository.save(wallet);

                String token = jwtProvider.createToken(
                                user.getId(), user.getEmail(), user.getTier());

                mvc.perform(get("/wallet/me")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.walletId").value(wallet.getId()));
        }
}