package com.neobank.auth.security;

import com.neobank.user.entity.User;
import com.neobank.user.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtProvider jwtProvider,
                         RefreshTokenService refreshTokenService,
                         UserRepository userRepository) {
        this.jwtProvider = jwtProvider;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7);

            if (jwtProvider.isValid(token) && !refreshTokenService.isAccessTokenBlacklisted(token)) {

                Long userId = jwtProvider.getUserId(token);

                User user = userRepository.findById(userId).orElse(null);
                if (user != null && user.isActive()) {

                    String email = jwtProvider.getEmail(token);
                    String tier = user.getTier();

                    AuthPrincipal principal = new AuthPrincipal(userId, email, tier);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    principal,
                                    null,
                                    principal.getAuthorities()
                            );

                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }

        chain.doFilter(request, response);
    }
}
