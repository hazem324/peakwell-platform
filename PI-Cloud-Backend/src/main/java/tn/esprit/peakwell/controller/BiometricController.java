package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.BiometricRequest;
import tn.esprit.peakwell.dto.BiometricResponse;
import tn.esprit.peakwell.dto.HealthAlertDto;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.BiometricService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/biometrics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BiometricController {

    private final BiometricService biometricService;
    private final AuthService authService;
    private final UserRepository userRepository;

    /** Resolve the current user's DB id from the Keycloak JWT in the security context. */
    private Long resolveUserId() {
        String keycloakId = authService.getCurrentUserId();
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found for keycloakId: " + keycloakId));
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<List<BiometricResponse>> getAll() {
        return ResponseEntity.ok(biometricService.getAll(resolveUserId()));
    }

    @PostMapping
    public ResponseEntity<?> addEntry(@Valid @RequestBody BiometricRequest request) {
        try {
            return ResponseEntity.ok(biometricService.addEntry(request, resolveUserId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<BiometricResponse> getLatest() {
        BiometricResponse latest = biometricService.getLatest(resolveUserId());
        return latest != null ? ResponseEntity.ok(latest) : ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        biometricService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<BiometricResponse>> getByProfileId(@PathVariable Long profileId) {
        return ResponseEntity.ok(biometricService.getByProfileId(profileId));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<HealthAlertDto>> getAlerts() {
        return ResponseEntity.ok(biometricService.getAlerts(resolveUserId()));
    }
}