package tn.esprit.peakwell.controller;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.entities.Dietitian;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.DietitianRepository;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.AutoApprovalService;
import tn.esprit.peakwell.services.IDietitianService;

import java.util.List;
import java.util.Map;

@Controller
@ResponseBody
@RequestMapping("/dietitian")
@RequiredArgsConstructor
public class DietitianController {

  private final IDietitianService  dietitianService;
  private final AutoApprovalService autoApprovalService;
  private final DietitianRepository dietitianRepo;
  private final AuthService         authService;
  private final UserRepository      userRepository;

  /** Resolves the current dietitian's DB id from the Keycloak JWT in the security context. */
  private Long resolveUserId() {
    String keycloakId = authService.getCurrentUserId();
    User user = userRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new RuntimeException("User not found for keycloakId: " + keycloakId));
    return user.getId();
  }

  /** GET /dietitian/all — public list of all approved dietitians for patient booking */
  @GetMapping("/all")
  @ResponseBody
  public ResponseEntity<List<Map<String, Object>>> getAll() {
    return ResponseEntity.ok(dietitianService.getAllDietitians());
  }

  @GetMapping("/schedule")
  public ResponseEntity<?> getSchedule() {
    Long userId = resolveUserId();
    return dietitianRepo.findById(userId)
            .map(d -> {
              List<String> days = (d.getWorkingDays() != null && !d.getWorkingDays().isEmpty())
                      ? d.getWorkingDays()
                      : List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
              int start = (d.getWorkStartHour() != null) ? d.getWorkStartHour() : 9;
              int end   = (d.getWorkEndHour()   != null) ? d.getWorkEndHour()   : 17;
              if (start >= end) { start = 9; end = 17; }
              return ResponseEntity.ok(Map.of(
                      "workingDays",   days,
                      "workStartHour", start,
                      "workEndHour",   end
              ));
            })
            .orElse(ResponseEntity.notFound().build());
  }

  /** PATCH /dietitian/schedule — save working hours */
  @PatchMapping("/schedule")
  @Transactional
  public ResponseEntity<?> saveSchedule(@RequestBody Map<String, Object> body) {
    Long userId = resolveUserId();
    Dietitian d = dietitianRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("Dietitian not found"));

    if (body.containsKey("workingDays")) {
      d.getWorkingDays().clear();
      d.getWorkingDays().addAll((List<String>) body.get("workingDays"));
    }
    if (body.containsKey("workStartHour"))
      d.setWorkStartHour(((Number) body.get("workStartHour")).intValue());
    if (body.containsKey("workEndHour"))
      d.setWorkEndHour(((Number) body.get("workEndHour")).intValue());

    dietitianRepo.save(d);

    autoApprovalService.runNow();

    return ResponseEntity.ok(Map.of("message", "Schedule saved"));

  }
}

