package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Base64;
import com.fasterxml.jackson.databind.ObjectMapper;

import tn.esprit.peakwell.dto.AuthResponse;
import tn.esprit.peakwell.dto.FaceLoginRequest;
import tn.esprit.peakwell.dto.LoginRequest;
import tn.esprit.peakwell.dto.RegisterRequest;
import tn.esprit.peakwell.entities.ActivityType;
import tn.esprit.peakwell.entities.Role;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;

import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    private final KeycloakService keycloakService;
    private final UserActivityService activityService;
    private final AiService aiService;
    @Autowired
    UserRepository userRepository;

    private final IEmailService emailService;

    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.client-id.front}")
    private String clientIdFront;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private static final double FACE_MATCH_THRESHOLD = 80.0;

    private final RestTemplate restTemplate = new RestTemplate();

    public ResponseEntity<?> login(LoginRequest request) {

        // Get user from DB
        User user = userRepository.findByEmail(request.getEmail());

        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        // Check if disabled by admin
        if (!user.isEnabled()) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Account is disabled by admin");
        }

        // Check if locked
        if (isLocked(user)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Account locked for 1 hour due to multiple failed attempts");
        }

        // Call Keycloak
        String url = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("username", request.getEmail());
        body.add("password", request.getPassword());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<?> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            Map<String, Object> res = response.getBody();

            // SUCCESS — reset attempts
            handleSuccessLogin(user);

            AuthResponse auth = new AuthResponse();
            auth.setAccessToken((String) res.get("access_token"));
            auth.setRefreshToken((String) res.get("refresh_token"));
            auth.setExpiresIn((Integer) res.get("expires_in"));

            activityService.log(user, ActivityType.LOGIN, "User logged in", "SUCCESS", null);

            return ResponseEntity.ok(auth);

        } catch (HttpClientErrorException e) {

            // WRONG PASSWORD
            if (e.getStatusCode().value() == 401) {

                handleFailedLogin(user);

                activityService.log(user, ActivityType.LOGIN_FAILED, "Failed login attempt - wrong password", "FAILED", null);

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }

            return ResponseEntity
                    .status(e.getStatusCode())
                    .body("Client error from Keycloak");

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Authentication server error");
        }
    }

    // face detection login

    @Override
    public ResponseEntity<?> faceLogin(FaceLoginRequest request) {

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail());
        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "No account found with this email."));
        }

        // Check account is active
        if (!user.isEnabled()) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account is disabled."));
        }

        if (isLocked(user)) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account locked due to multiple failed attempts."));
        }

        // Check a profile image exists in DB
        if (user.getImgUrl() == null || user.getImgUrl().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("message", "No profile image on file. Face login unavailable for this account."));
        }

        // Call Face++ to compare
        double confidence = aiService.compareFaces(request.getImageBase64(), user.getImgUrl());

        if (confidence < 0) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Face recognition service is unavailable. Please try again later."));
        }

        if (confidence < FACE_MATCH_THRESHOLD) {
            handleFailedLogin(user);
            activityService.log(user, ActivityType.LOGIN_FAILED,
                    "Face login failed - confidence: " + String.format("%.2f", confidence), "FAILED", null);

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Face does not match. Access denied.",
                            "confidence", confidence));
        }

        // Face matched — get Keycloak token via service account impersonation
        try {
            String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

            // Step A: get service account token (client credentials)
            MultiValueMap<String, String> saBody = new LinkedMultiValueMap<>();
            saBody.add("grant_type", "client_credentials");
            saBody.add("client_id", clientId);
            saBody.add("client_secret", clientSecret);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<Map> saResponse = restTemplate.postForEntity(
                    tokenUrl, new HttpEntity<>(saBody, headers), Map.class);

            String serviceAccountToken = (String) saResponse.getBody().get("access_token");

            // Step token exchange — impersonate the user
            MultiValueMap<String, String> exchangeBody = new LinkedMultiValueMap<>();
            exchangeBody.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
            exchangeBody.add("client_id", clientId);
            exchangeBody.add("client_secret", clientSecret);
            exchangeBody.add("subject_token", serviceAccountToken);
            exchangeBody.add("subject_token_type", "urn:ietf:params:oauth:token-type:access_token");
            exchangeBody.add("requested_subject", user.getKeycloakId()); // impersonate this user
            exchangeBody.add("requested_token_type", "urn:ietf:params:oauth:token-type:access_token");

            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(
                    tokenUrl, new HttpEntity<>(exchangeBody, headers), Map.class);

            Map<String, Object> res = tokenResponse.getBody();

            handleSuccessLogin(user);

            AuthResponse auth = new AuthResponse();
            auth.setAccessToken((String) res.get("access_token"));
            auth.setRefreshToken((String) res.get("refresh_token"));
            auth.setExpiresIn((Integer) res.get("expires_in"));

            activityService.log(user, ActivityType.LOGIN, "User logged in via face recognition", "SUCCESS", null);

            return ResponseEntity.ok(auth);

        } catch (Exception e) {
            System.err.println("[FaceLogin] Token exchange failed: " + e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Authentication succeeded but token issuance failed."));
        }
    }

    @Override
    public ResponseEntity<?> register(RegisterRequest request) {

        String keycloakId = null;

        try {

            keycloakId = keycloakService.createUser(request);

            System.out.println("EMAIL FROM FRONT: " + request.getEmail());
            User user = new User();
            user.setKeycloakId(keycloakId);
            user.setEmail(request.getEmail());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setRole(Role.valueOf(request.getRole()));

            userRepository.save(user);

            activityService.log(user, ActivityType.LOGIN, "User registered successfully", "SUCCESS", null);

            return ResponseEntity.status(201).body(
                    Map.of("message", "User registered successfully"));

        } catch (Exception e) {

            e.printStackTrace();

            // rollback
            if (keycloakId != null) {
                try {
                    keycloakService.deleteUser(keycloakId);
                } catch (Exception ex) {
                    System.err.println("Rollback failed: " + ex.getMessage());
                }
            }

            String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

            if (errorMessage.contains("409") || errorMessage.contains("exists")) {
                return ResponseEntity.status(409).body(Map.of("message", "User already exists"));
            }

            if (errorMessage.contains("401")) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            if (errorMessage.contains("invalid")) {
                return ResponseEntity.status(400).body(Map.of("message", "Invalid data"));
            }

            return ResponseEntity.status(500).body(Map.of("message", "Server error"));
        }
    }

    @Override
    public String getCurrentUserId() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // No authentication at all
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User not authenticated");
        }

        Object principal = authentication.getPrincipal();

        // Wrong principal type (not JWT)
        if (!(principal instanceof Jwt jwt)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authentication token");
        }

        // Missing subject
        String userId = jwt.getClaimAsString("sub");

        if (userId == null || userId.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid token: subject missing");
        }

        return userId;
    }

    @Override
    public void forgotPassword(String email) {
        keycloakService.forgotPassword(email);
    }

    public void handleFailedLogin(User user) {

        user.setFailedAttempts(user.getFailedAttempts() + 1);
        user.setTotalFailedAttempts(user.getTotalFailedAttempts() + 1);

        if (user.getFailedAttempts() >= 3) {

            user.setAccountLocked(true);
            user.setLockTime(new Date());

            // SEND LOCK EMAIL
            emailService.sendAccountLockedEmail(user);
        }

        userRepository.save(user);
    }

    public void handleSuccessLogin(User user) {
        user.setFailedAttempts(0);
        user.setAccountLocked(false);
        user.setLockTime(null);

        userRepository.save(user);
    }

    public boolean isLocked(User user) {

        if (!user.isAccountLocked())
            return false;

        long ONE_HOUR = 5 * 60 * 1000;

        if (user.getLockTime() == null)
            return false;
        long diff = new Date().getTime() - user.getLockTime().getTime();

        if (diff > ONE_HOUR) {

            user.setAccountLocked(false);
            user.setFailedAttempts(0);
            user.setLockTime(null);

            userRepository.save(user);

            return false;
        }

        return true;
    }

    @Override
    public String generateGoogleAuthUrl() {
        return UriComponentsBuilder
                .fromHttpUrl(serverUrl + "/realms/" + realm + "/protocol/openid-connect/auth")
                .queryParam("client_id", clientIdFront)
                .queryParam("redirect_uri", frontendUrl + "/auth/callback")
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("kc_idp_hint", "google")
                .toUriString();
    }

    @Override
    public ResponseEntity<?> handleGoogleLogin(String code, String flow) {

        String tokenUrl = serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", clientIdFront);
        body.add("code", code);
        body.add("redirect_uri", frontendUrl + "/auth/callback");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<?> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, entity, Map.class);

        if (response.getBody() == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Empty token response"));
        }

        Map<String, Object> res = response.getBody();
        String accessToken = (String) res.get("access_token");

        Map<String, Object> userInfo = decodeJwt(accessToken);

        String keycloakId = (String) userInfo.get("sub");
        String email = (String) userInfo.get("email");
        String firstName = (String) userInfo.get("given_name");
        String lastName = (String) userInfo.get("family_name");

        User existingByEmail = userRepository.findByEmail(email);

        if ("signup".equalsIgnoreCase(flow)) {
            if (existingByEmail != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Email already exists"));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "ROLE_SELECTION_REQUIRED",
                    "accessToken", accessToken,
                    "keycloakId", keycloakId,
                    "email", email,
                    "firstName", firstName,
                    "lastName", lastName));
        }

        if ("login".equalsIgnoreCase(flow)) {
            if (existingByEmail == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Account not found"));
            }

            AuthResponse auth = new AuthResponse();
            auth.setAccessToken(accessToken);
            auth.setRefreshToken((String) res.get("refresh_token"));
            auth.setExpiresIn((Integer) res.get("expires_in"));

            // FIX: use existingByEmail (was referencing undefined `user`)
            activityService.log(existingByEmail, ActivityType.LOGIN, "User logged in via Google", "SUCCESS", null);

            return ResponseEntity.ok(auth);
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Invalid flow"));
    }

    public ResponseEntity<?> completeGoogleSignup(String accessToken, Role role) {

        try {
            System.out.println("===== GOOGLE SIGNUP DEBUG =====");

            System.out.println("ACCESS TOKEN: " + accessToken);
            System.out.println("ROLE RECEIVED: " + role);

            Map<String, Object> userInfo = decodeJwt(accessToken);

            System.out.println("DECODED TOKEN: " + userInfo);

            String keycloakId = (String) userInfo.get("sub");
            String email = (String) userInfo.get("email");
            String firstName = (String) userInfo.get("given_name");
            String lastName = (String) userInfo.get("family_name");

            System.out.println("KEYCLOAK ID: " + keycloakId);
            System.out.println("EMAIL: " + email);
            System.out.println("FIRST NAME: " + firstName);
            System.out.println("LAST NAME: " + lastName);

            User existing = userRepository.findByEmail(email);
            System.out.println("EXISTING USER: " + existing);

            if (existing != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Email already exists"));
            }

            User user = new User();
            user.setKeycloakId(keycloakId);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setRole(role);

            keycloakService.assignRole(keycloakId, role.name());

            System.out.println("SAVING USER...");

            userRepository.save(user);

            System.out.println("USER SAVED SUCCESSFULLY");

            activityService.log(user, ActivityType.LOGIN, "User registered via Google", "SUCCESS", null);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "Account created successfully"));

        } catch (Exception e) {
            System.out.println("ERROR DURING GOOGLE SIGNUP:");
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    private Map<String, Object> decodeJwt(String token) {

        String[] parts = token.split("\\.");
        String payload = new String(Base64.getDecoder().decode(parts[1]));

        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(payload, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Invalid token");
        }
    }

    @Override
    public void changePassword(Authentication authentication, String oldPassword, String newPassword) {

        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }

        if (oldPassword == null || oldPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Old password is required");
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();

        String email = jwt.getClaim("email");
        String userId = jwt.getSubject();

        boolean valid = keycloakService.verifyOldPassword(email, oldPassword);

        if (!valid) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Old password is incorrect");
        }

        keycloakService.updatePassword(userId, newPassword);

        // Log password change — look up User by keycloakId to get the entity
        User user = userRepository.findByKeycloakId(userId)
                .orElse(null);

        if (user != null) {
            activityService.log(user, ActivityType.PASSWORD_CHANGE, "User changed their password", "SUCCESS", null);
        }
    }
}