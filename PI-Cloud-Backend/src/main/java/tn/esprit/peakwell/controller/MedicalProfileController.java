package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.BiometricResponse;
import tn.esprit.peakwell.dto.MedicalProfileRequest;
import tn.esprit.peakwell.dto.MedicalProfileResponse;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.BiometricService;
import tn.esprit.peakwell.services.MedicalProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class MedicalProfileController {

    private final MedicalProfileService profileService;
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
    public ResponseEntity<MedicalProfileResponse> getProfile() {
        MedicalProfileResponse profile = profileService.getProfile(resolveUserId());
        return profile != null ? ResponseEntity.ok(profile) : ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<MedicalProfileResponse> saveProfile(@RequestBody MedicalProfileRequest request) {
        return ResponseEntity.ok(profileService.saveProfile(request, resolveUserId()));
    }

    @PutMapping
    public ResponseEntity<MedicalProfileResponse> updateProfile(@RequestBody MedicalProfileRequest request) {
        return ResponseEntity.ok(profileService.saveProfile(request, resolveUserId()));
    }

    /** GET /api/profile/all — fetch all medical profiles (nutritionist view) */
    @GetMapping("/all")
    public ResponseEntity<List<MedicalProfileResponse>> getAllProfiles() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    /** GET /api/profile/by-student/{studentId} — fetch the profile belonging to a student */
    @GetMapping("/by-student/{studentId}")
    public ResponseEntity<MedicalProfileResponse> getByStudent(@PathVariable Long studentId) {
        MedicalProfileResponse res = profileService.getProfileByStudent(studentId);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.noContent().build();
    }

    /** GET /api/profile/by-dietitian/{dietitianId} — fetch all profiles assigned to a dietitian */
    @GetMapping("/by-dietitian/{dietitianId}")
    public ResponseEntity<List<MedicalProfileResponse>> getByDietitian(@PathVariable Long dietitianId) {
        return ResponseEntity.ok(profileService.getProfilesByDietitian(dietitianId));
    }

    /** PATCH /api/profile/{id}/assign-dietitian/{dietitianId} — assign a dietitian to a profile */
    @PatchMapping("/{id}/assign-dietitian/{dietitianId}")
    public ResponseEntity<MedicalProfileResponse> assignDietitian(
            @PathVariable Long id, @PathVariable Long dietitianId) {
        return ResponseEntity.ok(profileService.assignDietitian(id, dietitianId));
    }

    /** GET /api/profile/all-with-biometrics — admin view: all profiles + latest biometric entry */
    @GetMapping("/all-with-biometrics")
    public ResponseEntity<List<Map<String, Object>>> getAllWithBiometrics() {
        List<MedicalProfileResponse> profiles = profileService.getAllProfiles();
        List<Map<String, Object>> result = new ArrayList<>();
        for (MedicalProfileResponse p : profiles) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            p.getId());
            m.put("firstName",     p.getFirstName());
            m.put("lastName",      p.getLastName());
            m.put("gender",        p.getGender());
            m.put("bloodType",     p.getBloodType());
            m.put("height",        p.getHeight());
            m.put("studentId",     p.getStudentId());
            m.put("studentName",   p.getStudentName());
            m.put("dietitianName", p.getDietitianName());
            m.put("complete",      p.isComplete());
            String imageUrl = (p.getStudentId() != null)
                    ? userRepository.findById(p.getStudentId()).map(User::getImgUrl).orElse(null)
                    : null;
            m.put("imageUrl", imageUrl);
            List<BiometricResponse> bios = biometricService.getByProfileId(p.getId());
            if (!bios.isEmpty()) {
                BiometricResponse latest = bios.get(bios.size() - 1);
                m.put("weight",     latest.getWeight());
                m.put("bmi",        latest.getBmi());
                m.put("bodyFat",    latest.getBodyFat());
                m.put("muscleMass", latest.getMuscleMass());
                m.put("systolic",   latest.getSystolic());
                m.put("diastolic",  latest.getDiastolic());
                m.put("glucose",    latest.getGlucose());
                m.put("recordedAt", latest.getRecordedAt());
            } else {
                m.put("weight",     null);
                m.put("bmi",        null);
                m.put("bodyFat",    null);
                m.put("muscleMass", null);
                m.put("systolic",   null);
                m.put("diastolic",  null);
                m.put("glucose",    null);
                m.put("recordedAt", null);
            }
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }
}