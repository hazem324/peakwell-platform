package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Handles:
 *  - Computing free slots for a dietitian (next 7 working days, no conflicts)
 *  - Persisting SuggestedSlot records with UUID tokens
 *  - Confirming a slot when the patient clicks the email link → creates a new Consultation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SlotSuggestionService {

  private static final DateTimeFormatter LABEL_FMT =
          DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH:mm", Locale.FRENCH);

  private static final Map<DayOfWeek, String> DAY_MAP = Map.of(
          DayOfWeek.MONDAY,    "MONDAY",
          DayOfWeek.TUESDAY,   "TUESDAY",
          DayOfWeek.WEDNESDAY, "WEDNESDAY",
          DayOfWeek.THURSDAY,  "THURSDAY",
          DayOfWeek.FRIDAY,    "FRIDAY",
          DayOfWeek.SATURDAY,  "SATURDAY",
          DayOfWeek.SUNDAY,    "SUNDAY"
  );

  private final DietitianRepository     dietitianRepo;
  private final ConsultationRepository  consultRepo;
  private final SuggestedSlotRepository slotRepo;
  private final EmailConsultationService            emailService;

  @org.springframework.beans.factory.annotation.Value("${app.mail.test-recipient:}")
  private String testRecipient;

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Returns up to {@code maxSlots} free ISO-datetime strings for the given dietitian,
   * starting from tomorrow, spanning up to 10 working days.
   */
  public List<String> getAvailableSlots(Long dietitianId, int maxSlots) {
    Dietitian d = dietitianRepo.findById(dietitianId).orElse(null);
    if (d == null) return List.of();

    List<String> slots = new ArrayList<>();
    LocalDate cursor = LocalDate.now().plusDays(1); // start tomorrow
    int daysChecked = 0;

    while (slots.size() < maxSlots && daysChecked < 14) {
      String dayKey = DAY_MAP.get(cursor.getDayOfWeek());
      boolean isWorkingDay = d.getWorkingDays() != null && d.getWorkingDays().contains(dayKey);

      if (isWorkingDay) {
        int startH = d.getWorkStartHour() != null ? d.getWorkStartHour() : 9;
        int endH   = d.getWorkEndHour()   != null ? d.getWorkEndHour()   : 17;

        for (int h = startH; h < endH && slots.size() < maxSlots; h++) {
          LocalDateTime candidate = cursor.atTime(h, 0);
          if (isFree(dietitianId, candidate, 60)) {
            slots.add(candidate.toString()); // ISO-8601
          }
        }
      }
      cursor = cursor.plusDays(1);
      daysChecked++;
    }
    return slots;
  }

  /**
   * Creates SuggestedSlot records, sends the rejection + alternatives email,
   * and returns the list of created slots.
   */
  @Transactional(noRollbackFor = Exception.class)
  public List<SuggestedSlot> createSuggestionsAndNotify(
          Consultation original,
          List<String> isoSlots,
          String reason,
          String baseUrl) {

    List<SuggestedSlot> created = new ArrayList<>();
    List<String[]> emailRows   = new ArrayList<>(); // [label, url]

    for (String iso : isoSlots) {
      LocalDateTime proposedAt = LocalDateTime.parse(iso);
      String token = UUID.randomUUID().toString();

      SuggestedSlot slot = SuggestedSlot.builder()
              .originalConsultation(original)
              .proposedAt(proposedAt)
              .token(token)
              .expiresAt(LocalDateTime.now().plusHours(72))
              .build();

      created.add(slotRepo.save(slot));

      String label = proposedAt.format(LABEL_FMT);
      String url   = baseUrl + "/api/consultations/confirm-slot?token=" + token;
      emailRows.add(new String[]{ label, url });
    }

    // Send email only if we have a patient address
    String patientEmail = patientEmail(original);
    if (patientEmail != null) {
      emailService.sendRejectionWithSuggestions(
              patientEmail,
              patientName(original),
              original.getDoctorName(),
              original.getScheduledAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm")),
              reason,
              emailRows
      );
    }

    return created;
  }

  /**
   * Called when the patient clicks a confirmation link.
   * Validates the token, marks it used, creates a new UPCOMING consultation,
   * and sends a confirmation email.
   *
   * @return the new Consultation id, or throws if token invalid/expired/used.
   */
  @Transactional
  public Consultation confirmSlot(String token) {
    SuggestedSlot slot = slotRepo.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Lien de confirmation invalide."));

    if (slot.isUsed())
      throw new RuntimeException("Ce créneau a déjà été confirmé.");

    if (slot.getExpiresAt().isBefore(LocalDateTime.now()))
      throw new RuntimeException("Ce lien a expiré (72 h). Veuillez contacter votre nutritionniste.");

    Consultation original = slot.getOriginalConsultation();

    // Check the slot is still free
    Dietitian d = original.getDietitian();
    if (d != null && !isFree(d.getId(), slot.getProposedAt(), 60))
      throw new RuntimeException("Ce créneau n'est plus disponible. Veuillez contacter votre nutritionniste.");

    // Mark all sibling suggestions as used (only one slot per rejection can be confirmed)
    slotRepo.findByOriginalConsultationIdAndUsedFalse(original.getId())
            .forEach(s -> { s.setUsed(true); slotRepo.save(s); });

    // Create new consultation
    Consultation newC = Consultation.builder()
            .profile(original.getProfile())
            .dietitian(d)
            .scheduledAt(slot.getProposedAt())
            .durationMinutes(original.getDurationMinutes() != null ? original.getDurationMinutes() : 60)
            .status("UPCOMING")
            .doctorName(original.getDoctorName())
            .doctorSpecialty(original.getDoctorSpecialty())
            .consultationType(original.getConsultationType())
            .reason(original.getReason())
            .priority(original.getPriority() != null ? original.getPriority() : "NORMAL")
            .build();

    // Save via repo (injected below via setter to avoid circular dep)
    Consultation saved = consultRepo.save(newC);

    // Notify patient
    String email = patientEmail(original);
    if (email != null) {
      emailService.sendSlotConfirmed(
              email,
              patientName(original),
              saved.getDoctorName(),
              saved.getScheduledAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm"))
      );
    }

    log.info("[SlotSuggestion] Slot confirmed — new consultation id={}, at={}", saved.getId(), saved.getScheduledAt());
    return saved;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private boolean isFree(Long dietitianId, LocalDateTime from, int durationMin) {
    LocalDateTime to = from.plusMinutes(durationMin);
    return !consultRepo.existsConflict(dietitianId, from, to);
  }

  private String patientEmail(Consultation c) {
    try {
      String email = c.getProfile().getStudent().getUser().getEmail();
      if (email != null && !email.isBlank()) return email;
    } catch (Exception ignored) {}
    return (testRecipient != null && !testRecipient.isBlank()) ? testRecipient : null;
  }

  private String patientName(Consultation c) {
    try {
      var p = c.getProfile();
      return (p.getFirstName() + " " + p.getLastName()).trim();
    } catch (Exception e) { return "Patient"; }
  }

}