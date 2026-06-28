package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.entities.Notification;
import tn.esprit.peakwell.entities.Role;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.DietitianRepository;
import tn.esprit.peakwell.repositories.MedicalProfileRepository;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;
import tn.esprit.peakwell.services.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin("*")
public class NotificationController {

  private final NotificationService      notifService;
  private final AuthService              authService;
  private final UserRepository           userRepository;
  private final MedicalProfileRepository profileRepository;
  private final DietitianRepository      dietitianRepository;

  // ── Caller resolution ───────────────────────────

  private record Caller(Role role, Long profileId, Long dietitianId) {}

  private Caller resolveCaller() {
    try {
      String keycloakId = authService.getCurrentUserId();
      User user = userRepository.findByKeycloakId(keycloakId).orElse(null);
      if (user == null) return new Caller(null, null, null);

      if (user.getRole() == Role.STUDENT) {
        Long pid = profileRepository.findByStudentId(user.getId())
                .map(p -> p.getId()).orElse(null);
        return new Caller(Role.STUDENT, pid, null);
      }

      if (user.getRole() == Role.DIETITIAN) {
        Long did = dietitianRepository.findById(user.getId())
                .map(d -> d.getId()).orElse(null);
        return new Caller(Role.DIETITIAN, null, did);
      }

      return new Caller(user.getRole(), null, null);
    } catch (Exception e) {
      return new Caller(null, null, null);
    }
  }

  // ── Endpoints ───────────────────────────────────

  @GetMapping
  public List<Notification> getAll() {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT  && c.profileId()   != null) return notifService.getAll(c.profileId());
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) return notifService.getDietitianAll(c.dietitianId());
    return List.of();
  }

  @GetMapping("/unread-count")
  public Map<String, Long> getUnreadCount() {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT  && c.profileId()   != null) return Map.of("count", notifService.getUnreadCount(c.profileId()));
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) return Map.of("count", notifService.getDietitianUnreadCount(c.dietitianId()));
    return Map.of("count", 0L);
  }

  @PatchMapping("/{id}/read")
  public Notification markAsRead(@PathVariable Long id) {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT && c.profileId() != null) return notifService.markAsRead(id, c.profileId());
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) return notifService.markAsReadForDietitian(id, c.dietitianId());
    return null;
  }

  @PatchMapping("/read-all")
  public Map<String, String> markAllAsRead() {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT  && c.profileId()   != null) notifService.markAllAsRead(c.profileId());
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) notifService.markAllAsReadForDietitian(c.dietitianId());
    return Map.of("status", "ok");
  }

  @DeleteMapping("/{id}")
  public Map<String, String> dismiss(@PathVariable Long id) {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT  && c.profileId()   != null) notifService.dismiss(id, c.profileId());
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) notifService.dismissForDietitian(id, c.dietitianId());
    return Map.of("status", "dismissed");
  }

  @DeleteMapping("/dismiss-all")
  public Map<String, String> dismissAll() {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT  && c.profileId()   != null) notifService.dismissAll(c.profileId());
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) notifService.dismissAllForDietitian(c.dietitianId());
    return Map.of("status", "all dismissed");
  }

  @PostMapping("/check")
  public List<Notification> triggerCheck() {
    Caller c = resolveCaller();
    if (c.role() == Role.STUDENT  && c.profileId()   != null) return notifService.checkAndNotify(c.profileId());
    if (c.role() == Role.DIETITIAN && c.dietitianId() != null) { notifService.checkAndNotifyDietitians(); return notifService.getDietitianAll(c.dietitianId()); }
    return List.of();
  }
}