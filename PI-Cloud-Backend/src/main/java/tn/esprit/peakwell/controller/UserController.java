package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import tn.esprit.peakwell.dto.AccountStatusUpdateRequest;
import tn.esprit.peakwell.dto.CurrentUserDTO;
import tn.esprit.peakwell.dto.FailedAttemptsStatsDTO;
import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.RiskUserDTO;
import tn.esprit.peakwell.dto.RoleStatsDTO;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.dto.UserGrowthDTO;
import tn.esprit.peakwell.dto.UserProfile;
import tn.esprit.peakwell.dto.UserStatsDTO;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.UserService;

import java.util.List;
import java.util.Map;

@Controller
@ResponseBody
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserService userService;

    @PostMapping("/complete-profile")
    public ResponseEntity<?> completeProfile(@ModelAttribute ProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate) {

        User user = userService.completeProfile(request, image, certificate);

        CurrentUserDTO dto = mapToDTO(user);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {

        String keycloakId = authService.getCurrentUserId();

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Build DTO
        CurrentUserDTO dto = mapToDTO(user);

        // allow if profile not completed
        if (!dto.isProfileCompleted()) {
            return ResponseEntity.ok(dto);
        }

        // block if completed but not enabled
        if (!user.isEnabled()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account pending approval"));
        }

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {

            UserProfile profile = userService.getCurrentUserProfile();
            return ResponseEntity.ok(profile);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error");

        }
    }

    @PatchMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfile> updateProfile(
            @ModelAttribute UpdateProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "certificate", required = false) MultipartFile certificate) {

        UserProfile updatedProfile = userService.updateProfile(request, image, certificate);

        return ResponseEntity.ok(updatedProfile);
    }

    private CurrentUserDTO mapToDTO(User user) {

        return new CurrentUserDTO(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),

                user.getRole() != null ? user.getRole().name() : null,
                user.isProfileCompleted(),
                user.isEnabled(),

                user.getPhoneNumber(),
                user.getImgUrl(),
                user.getAddress());
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id, @RequestBody AccountStatusUpdateRequest request) {

        userService.toggleStatus(id, request);

        return ResponseEntity.ok(
                Map.of("message", "User status updated successfully"));
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserProfile>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/global")
    public UserStatsDTO getGlobalStats() {
        return userService.getGlobalStats();
    }

    @GetMapping("/roles")
    public List<RoleStatsDTO> getRoleStats() {
        return userService.getRoleStats();
    }

    @GetMapping("/growth")
    public List<UserGrowthDTO> getGrowth() {
        return userService.getGrowth();
    }

    @GetMapping("/risk")
    public List<RiskUserDTO> getRiskUsers() {
        return userService.getTopRiskUsers();
    }

    @GetMapping("/failed-attempts")
    public FailedAttemptsStatsDTO getFailedAttempts() {
        return userService.getFailedAttemptsStats();
    }


    
}