package tn.esprit.peakwell.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaTokenService {

    @Value("${captcha.jwt-secret}")
    private String jwtSecret;

    @Value("${captcha.token-ttl-minutes}")
    private long ttlMinutes;

    // One-time-use blacklist — swap for Redis in production
    private final Set<String> consumedTokens = ConcurrentHashMap.newKeySet();

    // Called after user passes image challenge → returns a short-lived JWT
    public String generateToken() {
        return Jwts.builder()
                .setId(UUID.randomUUID().toString())
                .setSubject("captcha-passed")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ttlMinutes * 60_000L))
                .signWith(
                        Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }

    // Called by auth signup — validates JWT + ensures one-time use
    public boolean validateAndConsume(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(
                        Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    )
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String jti = claims.getId();

            if (consumedTokens.contains(jti)) return false; // already used

            consumedTokens.add(jti); // mark as consumed
            return true;

        } catch (JwtException e) {
            // Expired, bad signature, or malformed
            return false;
        }
    }
}
