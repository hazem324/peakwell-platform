package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.peakwell.dto.ConsultationResponse;
import tn.esprit.peakwell.entities.Consultation;
import tn.esprit.peakwell.entities.Role;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.ConsultationRepository;
import tn.esprit.peakwell.repositories.UserRepository;
import tn.esprit.peakwell.services.AuthService;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin-only consultation endpoints.
 * Role check is done against the application's own User.role (Role.ADMIN) —
 * no Keycloak realm role required, no separate admin entity created.
 */
@RestController
@RequestMapping("/api/consultations/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AdminConsultationController {

  private static final DateTimeFormatter DT_FMT =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

  private final ConsultationRepository consultRepo;
  private final AuthService            authService;
  private final UserRepository         userRepository;

  /**
   * GET /api/consultations/admin/all
   * Returns ALL consultations across all dietitians, sorted by dietitian name (asc).
   * Requires the authenticated user to have Role.ADMIN in the database.
   */
  @GetMapping("/all")
  public ResponseEntity<List<ConsultationResponse>> getAll() {
    requireAdmin();

    List<ConsultationResponse> result = consultRepo.findAllByOrderByScheduledAtDesc()
        .stream()
        .sorted(Comparator.comparing(
            c -> c.getDoctorName() != null ? c.getDoctorName().toLowerCase() : "",
            Comparator.naturalOrder()
        ))
        .map(this::toResponse)
        .collect(Collectors.toList());

    return ResponseEntity.ok(result);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Throws 403 if the current user is not an ADMIN in the DB. */
  private void requireAdmin() {
    String keycloakId = authService.getCurrentUserId();
    User user = userRepository.findByKeycloakId(keycloakId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    if (user.getRole() != Role.ADMIN) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
  }

  // ── Mapping ──────────────────────────────────────────────────────────────

  private ConsultationResponse toResponse(Consultation c) {
    String patientName = null;
    if (c.getProfile() != null) {
      String fn = c.getProfile().getFirstName() != null ? c.getProfile().getFirstName() : "";
      String ln = c.getProfile().getLastName()  != null ? c.getProfile().getLastName()  : "";
      patientName = (fn + " " + ln).trim();
      if (patientName.isBlank()) patientName = null;
    }

    return ConsultationResponse.builder()
        .id(c.getId())
        .scheduledAt(c.getScheduledAt() != null ? c.getScheduledAt().format(DT_FMT) : null)
        .durationMinutes(c.getDurationMinutes())
        .status(c.getStatus())
        .doctorName(c.getDoctorName())
        .doctorSpecialty(c.getDoctorSpecialty())
        .consultationType(c.getConsultationType())
        .reason(c.getReason())
        .priority(c.getPriority())
        .doctorNotes(c.getDoctorNotes())
        .diagnosis(c.getDiagnosis())
        .prescription(c.getPrescription())
        .followUpInstructions(c.getFollowUpInstructions())
        .followUpDate(c.getFollowUpDate() != null ? c.getFollowUpDate().format(DT_FMT) : null)
        .rejectionReason(c.getRejectionReason())
        .patientName(patientName)
        .reminder24hSent(c.getReminder24hSent())
        .reminder1hSent(c.getReminder1hSent())
        .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().format(DT_FMT) : null)
        .completedAt(c.getCompletedAt() != null ? c.getCompletedAt().format(DT_FMT) : null)
        .build();
  }
}
