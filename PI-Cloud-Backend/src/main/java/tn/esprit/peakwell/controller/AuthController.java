package tn.esprit.peakwell.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import tn.esprit.peakwell.dto.ChangePasswordRequest;
import tn.esprit.peakwell.dto.FaceLoginRequest;
import tn.esprit.peakwell.dto.ForgotPasswordRequest;
import tn.esprit.peakwell.dto.GoogleSignupRequest;
import tn.esprit.peakwell.dto.LoginRequest;
import tn.esprit.peakwell.dto.RegisterRequest;
import tn.esprit.peakwell.entities.Role;
import tn.esprit.peakwell.services.IAuthService;

import java.util.Map;

@Controller
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    IAuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // face detection login
    @PostMapping("/face-login")
    public ResponseEntity<?> faceLogin(@RequestBody FaceLoginRequest request) {
        return authService.faceLogin(request);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody ForgotPasswordRequest request) {

        authService.forgotPassword(request.getEmail());

        Map<String, Object> response = Map.of(
                "status", HttpStatus.OK.value(),
                "message", "Reset password email sent successfully");

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }


    @PostMapping("/change-password")
public ResponseEntity<?> changePassword(
        @RequestBody ChangePasswordRequest request, Authentication authentication) {

    authService.changePassword(
            authentication,
            request.getOldPassword(),
            request.getNewPassword()
    );

    return ResponseEntity.ok(Map.of(
            "status", 200,
            "message", "Password updated successfully"
    ));
}
    @GetMapping("/google-url")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl(@RequestParam String flow) {
        return ResponseEntity.ok(Map.of("url", authService.generateGoogleAuthUrl()));
    }

    @PostMapping("/google")
    public ResponseEntity<?> handleGoogleLogin(@RequestBody Map<String, String> body) {
        return authService.handleGoogleLogin(body.get("code"), body.get("flow"));
    }

    @PostMapping("/google/complete-signup")
    public ResponseEntity<?> completeGoogleSignup(@RequestBody GoogleSignupRequest request) {

        String accessToken = request.getAccessToken();

        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid role"));
        }

        return authService.completeGoogleSignup(accessToken, role);
    }

}