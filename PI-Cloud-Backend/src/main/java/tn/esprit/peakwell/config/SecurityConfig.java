package tn.esprit.peakwell.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/users/**").permitAll()
                        .requestMatchers("/activity/**").permitAll()
                        .requestMatchers("/images/**").permitAll()
                        .requestMatchers("/ai/**").permitAll()
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/restaurant/**").permitAll()
                        .requestMatchers("/products/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/meals/**").permitAll()
                        .requestMatchers("/menu/**").permitAll()
                        .requestMatchers("/favorites/**").permitAll()
                        .requestMatchers("/articles/images/**").permitAll()
                        .requestMatchers("/articles/**").permitAll()
                        .requestMatchers("/captcha/**").permitAll()
                        .requestMatchers("/reservations/count/**").permitAll()
                        .requestMatchers("/reservations/plan/**").permitAll()
                        .requestMatchers("/plan/**").permitAll()
                        .requestMatchers("/api/plan/today/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/dietitian/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/consultations/confirm-slot").permitAll()
                        .requestMatchers("/api/insights/**").permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(jwt ->
                                jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );

        return http.build();
    }

    @Bean
    public Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            var roles = ((java.util.Map<String, Object>) jwt.getClaims().get("realm_access"))
                    .get("roles");

            var authorities = ((java.util.List<String>) roles)
                    .stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .toList();

            return new JwtAuthenticationToken(jwt, authorities);
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(java.util.List.of("http://localhost:4200"));
        config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(java.util.List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }


}