package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.peakwell.entities.Consultation;
import tn.esprit.peakwell.entities.Dietitian;
import tn.esprit.peakwell.repositories.ConsultationRepository;
import tn.esprit.peakwell.repositories.DietitianRepository;
import org.springframework.context.annotation.Lazy;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Runs every 10 minutes and processes every PENDING_APPROVAL consultation
 * using the following rules (in order):
 *
 *  1. scheduledAt is in the past               → REJECTED  (missed)
 *  2. scheduledAt < now + 2 h                  → REJECTED  (too-last-minute)
 *  3. scheduledAt falls outside dietitian's
 *     working hours / days                     → REJECTED  (outside schedule)
 *  4. Conflict with an existing UPCOMING for
 *     the same dietitian                        → REJECTED  (slot taken)
 *  5. All checks passed                         → UPCOMING  (auto-accepted)
 */
@Service
@Slf4j
public class AutoApprovalService {

  private static final DateTimeFormatter FMT =
          DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");

  // Map Java DayOfWeek → the strings stored in dietitian_working_days
  private static final Map<DayOfWeek, String> DAY_MAP = Map.of(
          DayOfWeek.MONDAY,    "MONDAY",
          DayOfWeek.TUESDAY,   "TUESDAY",
          DayOfWeek.WEDNESDAY, "WEDNESDAY",
          DayOfWeek.THURSDAY,  "THURSDAY",
          DayOfWeek.FRIDAY,    "FRIDAY",
          DayOfWeek.SATURDAY,  "SATURDAY",
          DayOfWeek.SUNDAY,    "SUNDAY"
  );

  private final ConsultationRepository consultationRepo;
  private final DietitianRepository    dietitianRepo;
  private final EmailConsultationService           emailService;

  private final SlotSuggestionService  slotSuggestionService;

  @org.springframework.beans.factory.annotation.Value("${app.base-url:http://localhost:8090/peakwell}")
  private String baseUrl;

  @org.springframework.beans.factory.annotation.Value("${app.mail.test-recipient:}")
  private String testRecipient;

  public AutoApprovalService(
          ConsultationRepository consultationRepo,
          DietitianRepository dietitianRepo,
          EmailConsultationService emailService,
          @Lazy SlotSuggestionService slotSuggestionService) {
    this.consultationRepo    = consultationRepo;
    this.dietitianRepo       = dietitianRepo;
    this.emailService        = emailService;
    this.slotSuggestionService = slotSuggestionService;
  }

  // ── Scheduled job ────────────────────────────────────────────────────────

  /** Called automatically every 10 minutes by the scheduler. */
  @Scheduled(fixedDelay = 10 * 60 * 1000)
  @Transactional
  public void scheduledRun() {
    runNow();
  }

  /**
   * Public entry point — can also be triggered on-demand from a controller.
   * Returns a summary of what was processed.
   */
  @Transactional
  public Map<String, Object> runNow() {
    List<Consultation> pending =
            consultationRepo.findByStatusOrderByScheduledAtAsc("PENDING_APPROVAL");

    log.info("[AutoApproval] Triggered — {} PENDING_APPROVAL consultation(s) found", pending.size());

    int accepted = 0, rejected = 0, leftPending = 0;
    LocalDateTime now = LocalDateTime.now();

    for (Consultation c : pending) {
      String statusBefore = c.getStatus();
      try {
        evaluate(c, now);
        String statusAfter = consultationRepo.findById(c.getId())
                .map(Consultation::getStatus).orElse(statusBefore);
        if ("UPCOMING".equals(statusAfter))  accepted++;
        else if ("REJECTED".equals(statusAfter)) rejected++;
        else leftPending++;
      } catch (Exception ex) {
        log.error("[AutoApproval] Error on consultation {}: {}", c.getId(), ex.getMessage());
        leftPending++;
      }
    }

    log.info("[AutoApproval] Done — accepted={}, rejected={}, leftPending={}", accepted, rejected, leftPending);
    return Map.of(
            "processed", pending.size(),
            "accepted",  accepted,
            "rejected",  rejected,
            "leftPending", leftPending
    );
  }

  // ── Core logic ────────────────────────────────────────────────────────────

  public void evaluate(Consultation c, LocalDateTime now) {
    LocalDateTime scheduled = c.getScheduledAt();
    long minutesUntil = java.time.Duration.between(now, scheduled).toMinutes();

    // Rule 1 — already in the past
    if (scheduled.isBefore(now)) {
      reject(c, "La consultation est passée sans confirmation.");
      return;
    }

    // Rule 2 — less than 2 hours advance notice
    if (minutesUntil < 120) {
      reject(c, "Délai trop court : la réservation doit être faite au moins 2 heures à l'avance.");
      return;
    }

    // Rule 3 — outside dietitian's working schedule
    // Use the linked dietitian, or fall back to the first dietitian in the database
    Dietitian d = c.getDietitian();
    if (d == null) {
      d = dietitianRepo.findFirstBy().orElse(null);
    }

    if (d != null) {
      String dayKey = DAY_MAP.get(scheduled.getDayOfWeek());

      // Use defaults when the dietitian hasn't configured their schedule
      List<String> effectiveDays = (d.getWorkingDays() == null || d.getWorkingDays().isEmpty())
              ? List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")
              : d.getWorkingDays();
      int workStart = (d.getWorkStartHour() != null) ? d.getWorkStartHour() : 9;
      int workEnd   = (d.getWorkEndHour()   != null) ? d.getWorkEndHour()   : 17;

      boolean dayOff  = !effectiveDays.contains(dayKey);
      int hour = scheduled.getHour();
      boolean hourOff = hour < workStart || hour >= workEnd;

      if (dayOff || hourOff) {
        reject(c, "Le créneau demandé est en dehors des horaires de travail du nutritionniste.");
        return;
      }

      // Rule 4 — slot conflict → reject
      int duration = c.getDurationMinutes() != null ? c.getDurationMinutes() : 60;
      LocalDateTime windowEnd = scheduled.plusMinutes(duration);
      if (consultationRepo.existsConflict(d.getId(), scheduled, windowEnd)) {
        reject(c, "Ce créneau est déjà pris par une autre consultation.");
        return;
      }
    }

    // All checks passed → auto-accept
    accept(c);
  }

  // ── State transitions ─────────────────────────────────────────────────────

  private void reject(Consultation c, String reason) {
    c.setStatus("REJECTED");
    c.setRejectionReason(reason);
    consultationRepo.save(c);
    log.info("[AutoApproval] Consultation {} REJECTED — {}", c.getId(), reason);

    // Compute available slots and send rejection email with alternatives
    try {
      Dietitian d = c.getDietitian() != null
              ? c.getDietitian()
              : dietitianRepo.findFirstBy().orElse(null);

      if (d != null) {
        List<String> slots = slotSuggestionService.getAvailableSlots(d.getId(), 3);
        if (!slots.isEmpty()) {
          slotSuggestionService.createSuggestionsAndNotify(c, slots, reason, baseUrl);
          return; // email already sent with suggestions
        }
      }
    } catch (Exception ex) {
      log.warn("[AutoApproval] Could not compute slot suggestions for {}: {}", c.getId(), ex.getMessage());
    }

    // Fallback: send plain rejection email (no slots available)
    sendRejectionEmail(c, reason);
  }

  private void accept(Consultation c) {
    c.setStatus("UPCOMING");
    consultationRepo.save(c);
    log.info("[AutoApproval] Consultation {} AUTO-ACCEPTED", c.getId());

    sendConfirmationEmail(c);
  }

  // ── Email helpers ─────────────────────────────────────────────────────────

  private String patientEmail(Consultation c) {
    try {
      String email = c.getProfile().getStudent().getUser().getEmail();
      if (email != null && !email.isBlank()) return email;
    } catch (Exception ignored) {}
    // Fallback to configured test recipient
    return (testRecipient != null && !testRecipient.isBlank()) ? testRecipient : null;
  }

  private String patientName(Consultation c) {
    try {
      var p = c.getProfile();
      return (p.getFirstName() + " " + p.getLastName()).trim();
    } catch (Exception e) {
      return "Patient";
    }
  }

  private void sendConfirmationEmail(Consultation c) {
    String email = patientEmail(c);
    if (email == null) return;
    emailService.sendBookingConfirmed(
            email,
            patientName(c),
            c.getDoctorName(),
            c.getScheduledAt().format(FMT)
    );
  }

  private void sendRejectionEmail(Consultation c, String reason) {
    String email = patientEmail(c);
    if (email == null) return;
    emailService.sendBookingRejected(
            email,
            patientName(c),
            c.getDoctorName(),
            c.getScheduledAt().format(FMT),
            reason
    );
  }
}