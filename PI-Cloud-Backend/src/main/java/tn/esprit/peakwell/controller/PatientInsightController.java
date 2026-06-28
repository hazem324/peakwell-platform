package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.dto.PatientInsightResponse;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.PatientInsightService;

import java.util.List;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PatientInsightController {

    private final PatientInsightService insightService;
    private final AuthService authService;
    private final UserRepository userRepository;

    /**
     * GET /api/insights/patients
     * Returns ML predictions for all patients of the current dietitian.
     */
    @GetMapping("/patients")
    public ResponseEntity<List<PatientInsightResponse>> getMyPatientsInsights() {
        Long dietitianId = resolveDietitianId();
        return ResponseEntity.ok(insightService.getInsightsForDietitian(dietitianId));
    }

    /**
     * GET /api/insights/patients/{profileId}
     * Returns ML prediction for a single patient.
     */
    @GetMapping("/patients/{profileId}")
    public ResponseEntity<PatientInsightResponse> getPatientInsight(@PathVariable Long profileId) {
        PatientInsightResponse insight = insightService.getInsightForPatient(profileId);
        if (insight == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(insight);
    }

    private Long resolveDietitianId() {
        String keycloakId = authService.getCurrentUserId();
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}
