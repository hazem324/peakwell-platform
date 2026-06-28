package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.HealthGoalRequest;
import tn.esprit.peakwell.dto.HealthGoalResponse;
import tn.esprit.peakwell.dto.HealthGoalResponse.MilestoneResponse;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.HealthGoalService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class HealthGoalController {

  private final HealthGoalService goalService;
  private final AuthService authService;
  private final UserRepository userRepository;

  @GetMapping
  public ResponseEntity<List<HealthGoalResponse>> getAll() {
    return ResponseEntity.ok(goalService.getAllGoals());
  }

  @GetMapping("/active")
  public ResponseEntity<List<HealthGoalResponse>> getActive() {
    return ResponseEntity.ok(goalService.getActiveGoals());
  }

  @PostMapping
  public ResponseEntity<HealthGoalResponse> create(@RequestBody HealthGoalRequest request) {
    return ResponseEntity.ok(goalService.createGoal(request));
  }

  @PatchMapping("/{id}/deactivate")
  public ResponseEntity<HealthGoalResponse> deactivate(@PathVariable Long id) {
    return ResponseEntity.ok(goalService.deactivateGoal(id));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    goalService.deleteGoal(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/pause")
  public ResponseEntity<HealthGoalResponse> pause(@PathVariable Long id, @RequestBody Map<String, String> body) {
    return ResponseEntity.ok(goalService.pauseGoal(id, body.getOrDefault("reason", "")));
  }

  @PatchMapping("/{id}/resume")
  public ResponseEntity<HealthGoalResponse> resume(@PathVariable Long id) {
    return ResponseEntity.ok(goalService.resumeGoal(id));
  }

  @PatchMapping("/{id}/edit")
  public ResponseEntity<HealthGoalResponse> edit(@PathVariable Long id, @RequestBody Map<String, String> body) {
    Double target = body.containsKey("targetValue") ? Double.parseDouble(body.get("targetValue")) : null;
    return ResponseEntity.ok(goalService.editGoal(id, target, body.get("deadline")));
  }

  @GetMapping("/profile/{profileId}")
  public ResponseEntity<List<HealthGoalResponse>> getForProfile(@PathVariable Long profileId) {
    return ResponseEntity.ok(goalService.getGoalsForProfile(profileId));
  }

  @PostMapping("/profile/{profileId}")
  public ResponseEntity<HealthGoalResponse> createForProfile(
          @PathVariable Long profileId,
          @RequestBody HealthGoalRequest request) {
    String dietitianName = "Nutritionist";
    try {
      String keycloakId = authService.getCurrentUserId();
      User user = userRepository.findByKeycloakId(keycloakId).orElse(null);
      if (user != null) {
        String name = (user.getFirstName() + " " + user.getLastName()).trim();
        if (!name.isBlank()) dietitianName = name;
      }
    } catch (Exception ignored) {}
    return ResponseEntity.ok(goalService.createGoalForProfile(profileId, request, dietitianName));
  }

  @PatchMapping("/milestones/{milestoneId}/note")
  public ResponseEntity<MilestoneResponse> addNote(
          @PathVariable Long milestoneId, @RequestBody Map<String, String> body) {
    return ResponseEntity.ok(goalService.addMilestoneNote(milestoneId, body.get("note")));
  }

  @GetMapping("/{id}/chart-data")
  public ResponseEntity<Map<String, Object>> chartData(@PathVariable Long id) {
    return ResponseEntity.ok(goalService.getChartData(id));
  }

  @Data
  static class PauseRequest { String reason; }
}