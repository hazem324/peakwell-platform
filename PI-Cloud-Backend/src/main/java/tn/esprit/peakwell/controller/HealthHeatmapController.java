package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.HealthHeatmapService;

import java.util.Map;

@RestController
@RequestMapping("/api/heatmap")
@RequiredArgsConstructor
@CrossOrigin("*")
public class HealthHeatmapController {

  private final HealthHeatmapService heatmapService;
  private final AuthService          authService;
  private final UserRepository       userRepository;

  @GetMapping
  public Map<String, Object> getHeatmapData() {
    try {
      String keycloakId = authService.getCurrentUserId();
      User user = userRepository.findByKeycloakId(keycloakId)
          .orElseThrow(() -> new RuntimeException("User not found"));
      return heatmapService.getHeatmapData(user.getId());
    } catch (Exception e) {
      // Fallback for unauthenticated calls (e.g. admin)
      return heatmapService.getHeatmapData(null);
    }
  }
}
