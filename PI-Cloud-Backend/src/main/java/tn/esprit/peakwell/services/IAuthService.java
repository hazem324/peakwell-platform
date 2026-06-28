package tn.esprit.peakwell.services;

import tn.esprit.peakwell.dto.FaceLoginRequest;
import tn.esprit.peakwell.dto.LoginRequest;
import tn.esprit.peakwell.dto.RegisterRequest;
import tn.esprit.peakwell.entities.Role;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

public interface IAuthService {

    ResponseEntity<?> login(LoginRequest request);
    ResponseEntity<?> register(RegisterRequest request);
    ResponseEntity<?> faceLogin(FaceLoginRequest request);

    String generateGoogleAuthUrl();
    ResponseEntity<?> handleGoogleLogin(String code, String flow);
    ResponseEntity<?> completeGoogleSignup(String accessToken, Role role);

    String getCurrentUserId();

    void forgotPassword(String email);
    void changePassword(Authentication authentication, String oldPassword, String newPassword);
}