package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.services.RiskProfilerService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/risk-profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class RiskProfilerController {

  private final RiskProfilerService riskService;

  // Dietitian view — profile ALL patients at once
  @GetMapping("/all")
  public ResponseEntity<List<Map<String, Object>>> getAllProfiles() {
    return ResponseEntity.ok(riskService.profileAllPatients());
  }

  // Single patient profile (for front-office or detail view)
  @GetMapping("/{profileId}")
  public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Long profileId) {
    return ResponseEntity.ok(riskService.profilePatient(profileId));
  }

  // Default — profile ID 1 (backwards compatible)
  @GetMapping
  public ResponseEntity<Map<String, Object>> getDefaultProfile() {
    return ResponseEntity.ok(riskService.profilePatient(1L));
  }

  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> status() {
    return ResponseEntity.ok(Map.of("modelLoaded", riskService.isModelLoaded()));
  }
}
