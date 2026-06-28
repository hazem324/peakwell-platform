package tn.esprit.peakwell.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import tn.esprit.peakwell.dto.ConsultationRequest;
import tn.esprit.peakwell.dto.ConsultationResponse;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;
import tn.esprit.peakwell.repositories.DietitianRepository;
import tn.esprit.peakwell.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsultationService {

  private final ConsultationRepository consultRepo;
  private final MedicalProfileRepository profileRepo;
  private final BiometricEntryRepository biometricRepo;
  private final HealthGoalRepository goalRepo;
  private final SymptomEntryRepository symptomRepo;
  private final FeedbackRepository feedbackRepo;
  private final ObjectMapper objectMapper;
  private final EmailConsultationService emailService;
  private final DietitianRepository dietitianRepo;
  private final AutoApprovalService autoApprovalService;
  private final UserRepository userRepository;
  private final AuthService authService;
  private final NotificationService notificationService;

  public List<ConsultationResponse> getAll(Long dietitianId) {
    if (dietitianId == null)
      return consultRepo.findAllByOrderByScheduledAtDesc()
              .stream().map(this::toResponse).collect(Collectors.toList());
    return consultRepo.findByDietitianIdAndStatusNotOrderByScheduledAtDesc(dietitianId, "CANCELLED")
            .stream().map(this::toResponse).collect(Collectors.toList());
  }
  private MedicalProfile currentProfile() {
    String keycloakId = authService.getCurrentUserId();
    User user = userRepository.findByKeycloakId(keycloakId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return profileRepo.findByStudentId(user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medical profile not found"));
  }

  public List<ConsultationResponse> getUpcoming() {
    Long profileId = currentProfile().getId();
    return consultRepo.findByScheduledAtAfterOrderByScheduledAtAsc(LocalDateTime.now())
            .stream()
            .filter(c -> !"CANCELLED".equals(c.getStatus()))
            .filter(c -> c.getProfile() != null && profileId.equals(c.getProfile().getId()))
            .map(this::toResponse)
            .collect(Collectors.toList());
  }

  public List<ConsultationResponse> getPending(Long dietitianId) {
    return consultRepo.findByDietitianIdAndStatusOrderByScheduledAtAsc(dietitianId, "PENDING_APPROVAL")
            .stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional
  public ConsultationResponse confirm(Long id, Long dietitianId) {
    Consultation c = find(id);
    verifyDietitianOwnership(c, dietitianId);
    if (!"PENDING_APPROVAL".equals(c.getStatus()))
      throw new RuntimeException("Consultation is not pending approval");
    c.setStatus("UPCOMING");
    Consultation saved = consultRepo.save(c);
    sendEmailIfPossible(saved, "CONFIRMED");
    return toResponse(saved);
  }

  @Transactional
  public ConsultationResponse reject(Long id, String reason, Long dietitianId) {
    Consultation c = find(id);
    verifyDietitianOwnership(c, dietitianId);
    if (!"PENDING_APPROVAL".equals(c.getStatus()))
      throw new RuntimeException("Consultation is not pending approval");
    c.setStatus("REJECTED");
    c.setRejectionReason(reason);
    Consultation saved = consultRepo.save(c);
    sendEmailIfPossible(saved, "REJECTED");
    return toResponse(saved);
  }
  public List<ConsultationResponse> getPast() {
    Long profileId = currentProfile().getId();
    return consultRepo.findByScheduledAtBeforeAndStatusNotOrderByScheduledAtDesc(LocalDateTime.now(), "CANCELLED")
            .stream()
            .filter(c -> c.getProfile() != null && profileId.equals(c.getProfile().getId()))
            .map(this::toResponse)
            .collect(Collectors.toList());
  }
  public ConsultationResponse getById(Long id) { return toResponse(find(id)); }

  @Transactional
  public ConsultationResponse book(ConsultationRequest req) {
    MedicalProfile profile = currentProfile();
    Dietitian dietitian = req.getDietitianId() != null
            ? dietitianRepo.findById(req.getDietitianId()).orElse(null) : null;
    Consultation c = Consultation.builder()
            .profile(profile)
            .dietitian(dietitian)
            .scheduledAt(parseDateTime(req.getScheduledAt()))
            .durationMinutes(req.getDurationMinutes() != null ? req.getDurationMinutes() : 30)
            .doctorName(req.getDoctorName()).doctorSpecialty(req.getDoctorSpecialty())
            .consultationType(req.getConsultationType() != null ? req.getConsultationType() : "IN_PERSON")
            .reason(req.getReason()).priority(req.getPriority() != null ? req.getPriority() : "NORMAL")
            .build();
    attachBiometricSnapshot(c);
    attachGoalSnapshot(c);
    generateAiSummary(c, profile);
    Consultation saved = consultRepo.save(c);
    sendEmailIfPossible(saved, "BOOKED");

    // Immediately evaluate the new consultation against the auto-approval rules
    autoApprovalService.evaluate(saved, LocalDateTime.now());
    // Re-fetch to return the final status after evaluation
    saved = consultRepo.findById(saved.getId()).orElse(saved);

    // Notify the assigned dietitian of the new booking
    if (saved.getDietitian() != null) {
      try {
        String patientName = profile.getFirstName() + " " + profile.getLastName();
        String date = saved.getScheduledAt().format(java.time.format.DateTimeFormatter.ofPattern("MMM d 'at' HH:mm"));
        notificationService.notifyNewBooking(saved.getDietitian(), patientName.trim(), date);
      } catch (Exception ex) {
        log.warn("Could not send booking notification to dietitian: {}", ex.getMessage());
      }
    }

    return toResponse(saved);
  }

  @Transactional
  public ConsultationResponse addNotes(Long id, ConsultationRequest req) {
    Consultation c = find(id);
    if (req.getDoctorNotes() != null) c.setDoctorNotes(req.getDoctorNotes());
    if (req.getDiagnosis() != null) c.setDiagnosis(req.getDiagnosis());
    if (req.getPrescription() != null) c.setPrescription(req.getPrescription());
    if (req.getFollowUpInstructions() != null) c.setFollowUpInstructions(req.getFollowUpInstructions());
    if (req.getFollowUpDate() != null) c.setFollowUpDate(parseDateTime(req.getFollowUpDate()));
    return toResponse(consultRepo.save(c));
  }

  @Transactional
  public ConsultationResponse updateStatus(Long id, String status) {
    Consultation c = find(id);
    c.setStatus(status.toUpperCase());
    if ("COMPLETED".equalsIgnoreCase(status)) { c.setCompletedAt(LocalDateTime.now()); attachBiometricSnapshot(c); }
    return toResponse(consultRepo.save(c));
  }

  @Transactional
  public void cancel(Long id) {
    Consultation c = find(id);
    c.setStatus("CANCELLED");
    consultRepo.save(c);
    notifyDietitianOfCancellation(c);
    // Send in-app notification to dietitian
    if (c.getDietitian() != null) {
      try {
        String patientName = c.getProfile() != null
                ? (c.getProfile().getFirstName() + " " + c.getProfile().getLastName()).trim()
                : "A patient";
        String date = c.getScheduledAt().format(java.time.format.DateTimeFormatter.ofPattern("MMM d 'at' HH:mm"));
        notificationService.notifyConsultationCancelled(c.getDietitian(), patientName, date);
      } catch (Exception ex) {
        log.warn("Could not send cancellation notification to dietitian: {}", ex.getMessage());
      }
    }
  }

  private void notifyDietitianOfCancellation(Consultation c) {
    try {
      if (c.getDietitian() == null) return;
      User dietitianUser = c.getDietitian().getUser();
      if (dietitianUser == null || dietitianUser.getEmail() == null) return;
      String dietitianName = (dietitianUser.getFirstName() + " " + dietitianUser.getLastName()).trim();
      String patientName = c.getProfile() != null
              ? (c.getProfile().getFirstName() + " " + c.getProfile().getLastName()).trim()
              : "A patient";
      String date = c.getScheduledAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy 'at' HH:mm"));
      emailService.sendCancellationToDietitian(dietitianUser.getEmail(), dietitianName, patientName, date);
    } catch (Exception ex) {
      log.warn("Could not send cancellation email to dietitian for consultation {}: {}", c.getId(), ex.getMessage());
    }
  }

  @Transactional
  public ConsultationResponse updateDetails(Long id, ConsultationRequest req) {
    Consultation c = find(id);
    if (req.getReason() != null) c.setReason(req.getReason());
    if (req.getConsultationType() != null) c.setConsultationType(req.getConsultationType());
    if (req.getDurationMinutes() != null) c.setDurationMinutes(req.getDurationMinutes());
    if (req.getPriority() != null) c.setPriority(req.getPriority());
    if (req.getDoctorName() != null) c.setDoctorName(req.getDoctorName());
    if (req.getDoctorSpecialty() != null) c.setDoctorSpecialty(req.getDoctorSpecialty());
    if (req.getScheduledAt() != null) {
      c.setScheduledAt(parseDateTime(req.getScheduledAt()));
      c.setReminder24hSent(false);
      c.setReminder1hSent(false);
    }
    return toResponse(consultRepo.save(c));
  }

  @Transactional
  public ConsultationResponse changeDietitian(Long id, String doctorName, String doctorSpecialty) {
    Consultation c = find(id);
    c.setDoctorName(doctorName);
    if (doctorSpecialty != null) c.setDoctorSpecialty(doctorSpecialty);
    c.setReminder24hSent(false);
    c.setReminder1hSent(false);
    return toResponse(consultRepo.save(c));
  }

  @Transactional
  public ConsultationResponse reschedule(Long id, String newScheduledAt) {
    Consultation c = find(id);
    c.setScheduledAt(parseDateTime(newScheduledAt));
    c.setReminder24hSent(false);
    c.setReminder1hSent(false);
    // Reset to pending so auto-approval rules re-evaluate the new slot
    c.setStatus("PENDING_APPROVAL");
    c.setRejectionReason(null);
    Consultation saved = consultRepo.save(c);
    // Immediately evaluate the new slot against auto-approval rules
    autoApprovalService.evaluate(saved, LocalDateTime.now());
    saved = consultRepo.findById(saved.getId()).orElse(saved);
    return toResponse(saved);
  }

  // ── FEEDBACK ────────────────────────────────
  @Transactional
  public ConsultationResponse submitFeedback(Long consultId, Map<String, Object> data) {
    Consultation c = find(consultId);
    ConsultationFeedback fb = feedbackRepo.findByConsultationId(consultId)
            .orElse(ConsultationFeedback.builder().consultation(c).build());
    fb.setOverallRating(((Number) data.getOrDefault("overallRating", 3)).intValue());
    fb.setDoctorKnowledge(((Number) data.getOrDefault("doctorKnowledge", 3)).intValue());
    fb.setCommunication(((Number) data.getOrDefault("communication", 3)).intValue());
    fb.setHelpfulness(((Number) data.getOrDefault("helpfulness", 3)).intValue());
    fb.setWouldRecommend(((Number) data.getOrDefault("wouldRecommend", 3)).intValue());
    fb.setAdviceFollowed((Boolean) data.getOrDefault("adviceFollowed", null));
    fb.setSymptomsImproved((Boolean) data.getOrDefault("symptomsImproved", null));
    fb.setComments((String) data.getOrDefault("comments", null));
    feedbackRepo.save(fb);
    return toResponse(consultRepo.findById(consultId).orElseThrow());
  }

  // ── COMPARISON ──────────────────────────────
  public Map<String, Object> compareConsultations(Long id1, Long id2) {
    Consultation c1 = find(id1), c2 = find(id2);
    if (c1.getScheduledAt().isAfter(c2.getScheduledAt())) { Consultation t = c1; c1 = c2; c2 = t; }
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("earlier", snap(c1)); result.put("later", snap(c2));
    Map<String, Object> changes = new LinkedHashMap<>();
    addChange(changes, "weight", c1.getSnapshotWeight(), c2.getSnapshotWeight(), "kg", true);
    addChange(changes, "bmi", c1.getSnapshotBmi(), c2.getSnapshotBmi(), "", true);
    addChange(changes, "bodyFat", c1.getSnapshotBodyFat(), c2.getSnapshotBodyFat(), "%", true);
    addChange(changes, "systolic", c1.getSnapshotSystolic() != null ? c1.getSnapshotSystolic().doubleValue() : null,
            c2.getSnapshotSystolic() != null ? c2.getSnapshotSystolic().doubleValue() : null, "mmHg", true);
    addChange(changes, "glucose", c1.getSnapshotGlucose(), c2.getSnapshotGlucose(), "mg/dL", true);
    long improved = changes.values().stream().filter(v -> v instanceof Map && Boolean.TRUE.equals(((Map<?,?>)v).get("improved"))).count();
    String verdict = improved == changes.size() ? "Excellent — all metrics improved!" :
            improved > changes.size()/2 ? "Good progress — most metrics improved." :
                    improved > 0 ? "Mixed — some improved, others need work." : "Metrics worsened — discuss with doctor.";
    result.put("changes", changes); result.put("verdict", verdict);
    result.put("daysBetween", ChronoUnit.DAYS.between(c1.getScheduledAt(), c2.getScheduledAt()));
    return result;
  }

  private void addChange(Map<String, Object> changes, String key, Double v1, Double v2, String unit, boolean lowerBetter) {
    if (v1 == null || v2 == null) return;
    double diff = Math.round((v2 - v1) * 10.0) / 10.0;
    boolean improved = lowerBetter ? diff < 0 : diff > 0;
    changes.put(key, Map.of("from", v1, "to", v2, "change", diff, "unit", unit, "improved", improved,
            "label", (diff > 0 ? "+" : "") + diff + " " + unit));
  }

  private Map<String, Object> snap(Consultation c) {
    Map<String, Object> s = new LinkedHashMap<>();
    s.put("id", c.getId()); s.put("date", c.getScheduledAt().toString()); s.put("doctor", c.getDoctorName());
    if (c.getSnapshotWeight() != null) s.put("weight", c.getSnapshotWeight());
    if (c.getSnapshotBmi() != null) s.put("bmi", c.getSnapshotBmi());
    if (c.getSnapshotBodyFat() != null) s.put("bodyFat", c.getSnapshotBodyFat());
    if (c.getSnapshotSystolic() != null) s.put("systolic", c.getSnapshotSystolic());
    if (c.getSnapshotGlucose() != null) s.put("glucose", c.getSnapshotGlucose());
    return s;
  }

  // ── AI SUMMARY ──────────────────────────────
  private void generateAiSummary(Consultation c, MedicalProfile profile) {
    StringBuilder sb = new StringBuilder();
    sb.append("=== Patient Summary for Dr. ").append(c.getDoctorName()).append(" ===\n\n");
    if (profile != null) {
      sb.append("Patient: ").append(profile.getFirstName()).append(" ").append(profile.getLastName());
      if (profile.getGender() != null) sb.append(" | ").append(profile.getGender());
      if (profile.getBloodType() != null) sb.append(" | Blood: ").append(profile.getBloodType());
      sb.append("\n");
      if (profile.getConditions() != null && !profile.getConditions().isEmpty())
        sb.append("Conditions: ").append(String.join(", ", profile.getConditions())).append("\n");
      if (profile.getAllergies() != null && !profile.getAllergies().isEmpty())
        sb.append("Allergies: ").append(String.join(", ", profile.getAllergies())).append("\n");
      if (profile.getMedications() != null && !profile.getMedications().isEmpty())
        sb.append("Medications: ").append(String.join(", ", profile.getMedications())).append("\n");
    }
    sb.append("\n--- Latest Biometrics ---\n");
    biometricRepo.findTopByOrderByRecordedAtDesc().ifPresent(e -> {
      sb.append("Weight: ").append(e.getWeight()).append(" kg | BMI: ").append(e.getBmi());
      if (e.getBodyFat() != null) sb.append(" | Fat: ").append(e.getBodyFat()).append("%");
      if (e.getSystolic() != null) sb.append(" | BP: ").append(e.getSystolic()).append("/").append(e.getDiastolic());
      if (e.getGlucose() != null) sb.append(" | Glucose: ").append(e.getGlucose());
      sb.append("\n");
    });
    List<SymptomEntry> symptoms = symptomRepo.findTop10ByOrderByLogDateDesc();
    if (!symptoms.isEmpty()) {
      sb.append("\n--- Recent Symptoms ---\n");
      symptoms.forEach(s -> sb.append("• ").append(s.getSymptom()).append(" (sev ").append(s.getSeverity()).append("/10) — ").append(s.getLogDate()).append("\n"));
    }
    List<HealthGoal> goals = goalRepo.findByActiveTrueOrderByCreatedAtDesc();
    if (!goals.isEmpty()) {
      sb.append("\n--- Active Goals ---\n");
      goals.forEach(g -> sb.append("• ").append(g.getDirection()).append(" ").append(g.getMetric()).append(": ").append(g.getStartValue()).append(" → ").append(g.getTargetValue()).append(" ").append(g.getUnit()).append(g.getAchieved() ? " ✅" : "").append("\n"));
    }
    if (c.getReason() != null) sb.append("\n--- Reason ---\n").append(c.getReason()).append("\n");
    c.setAiSummary(sb.toString());
  }

  // ── GOAL SNAPSHOT ───────────────────────────
  private void attachGoalSnapshot(Consultation c) {
    List<HealthGoal> goals = goalRepo.findByActiveTrueOrderByCreatedAtDesc();
    if (goals.isEmpty()) return;
    try {
      List<Map<String, Object>> snap = new ArrayList<>();
      for (HealthGoal g : goals) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("metric", g.getMetric()); e.put("target", g.getTargetValue() + " " + g.getUnit());
        e.put("direction", g.getDirection()); e.put("achieved", g.getAchieved());
        long reached = g.getMilestones() != null ? g.getMilestones().stream().filter(GoalMilestone::getReached).count() : 0;
        long total = g.getMilestones() != null ? g.getMilestones().size() : 0;
        e.put("progress", total > 0 ? (int)(reached * 100 / total) : 0);
        e.put("milestones", reached + "/" + total);
        snap.add(e);
      }
      c.setGoalSnapshot(objectMapper.writeValueAsString(snap));
    } catch (Exception ex) { log.warn("Goal snapshot error: {}", ex.getMessage()); }
  }

  private void attachBiometricSnapshot(Consultation c) {
    biometricRepo.findTopByOrderByRecordedAtDesc().ifPresent(e -> {
      c.setSnapshotWeight(e.getWeight()); c.setSnapshotBmi(e.getBmi()); c.setSnapshotBodyFat(e.getBodyFat());
      c.setSnapshotSystolic(e.getSystolic()); c.setSnapshotDiastolic(e.getDiastolic()); c.setSnapshotGlucose(e.getGlucose());
    });
  }

  // ── REMINDERS ───────────────────────────────
  @Scheduled(fixedRate = 300000)
  @Transactional
  public void checkReminders() {
    LocalDateTime now = LocalDateTime.now();
    consultRepo.findByStatusOrderByScheduledAtAsc("UPCOMING").forEach(c -> {
      long mins = ChronoUnit.MINUTES.between(now, c.getScheduledAt());
      if (mins <= 1440 && mins > 60 && !c.getReminder24hSent()) { c.setReminder24hSent(true); consultRepo.save(c); sendEmailIfPossible(c, "REMINDER_24H"); log.info("24h reminder: consultation {} with Dr. {}", c.getId(), c.getDoctorName()); }
      if (mins <= 60 && mins > 0 && !c.getReminder1hSent()) { c.setReminder1hSent(true); consultRepo.save(c); sendEmailIfPossible(c, "REMINDER_1H"); log.info("1h reminder: consultation {} with Dr. {}", c.getId(), c.getDoctorName()); }
    });
  }

  // ── MAPPER ──────────────────────────────────
  private ConsultationResponse toResponse(Consultation c) {
    // Biometric snapshot
    Map<String, Object> bio = new LinkedHashMap<>();
    if (c.getSnapshotWeight() != null) bio.put("weight", c.getSnapshotWeight() + " kg");
    if (c.getSnapshotBmi() != null) bio.put("bmi", c.getSnapshotBmi());
    if (c.getSnapshotBodyFat() != null) bio.put("bodyFat", c.getSnapshotBodyFat() + "%");
    if (c.getSnapshotSystolic() != null) bio.put("bloodPressure", c.getSnapshotSystolic() + "/" + c.getSnapshotDiastolic() + " mmHg");
    if (c.getSnapshotGlucose() != null) bio.put("glucose", c.getSnapshotGlucose() + " mg/dL");

    // Goal snapshot
    List<Map<String, Object>> goalSnap = null;
    if (c.getGoalSnapshot() != null) {
      try { goalSnap = objectMapper.readValue(c.getGoalSnapshot(), List.class); } catch (Exception ignored) {}
    }

    // Feedback
    Map<String, Object> fb = null;
    if (c.getFeedback() != null) {
      ConsultationFeedback f = c.getFeedback();
      fb = new LinkedHashMap<>();
      fb.put("overallRating", f.getOverallRating());
      fb.put("doctorKnowledge", f.getDoctorKnowledge());
      fb.put("communication", f.getCommunication());
      fb.put("helpfulness", f.getHelpfulness());
      fb.put("wouldRecommend", f.getWouldRecommend());
      fb.put("adviceFollowed", f.getAdviceFollowed());
      fb.put("symptomsImproved", f.getSymptomsImproved());
      fb.put("comments", f.getComments());
    }

    // Rating
    Map<String, Object> ratingMap = null;
    if (c.getRating() != null) {
      ConsultationRating r = c.getRating();
      ratingMap = new LinkedHashMap<>();
      ratingMap.put("overallRating",         r.getOverallRating());
      ratingMap.put("doctorKnowledgeRating",  r.getDoctorKnowledgeRating());
      ratingMap.put("communicationRating",    r.getCommunicationRating());
      ratingMap.put("adviceUsefulnessRating", r.getAdviceUsefulnessRating());
      ratingMap.put("punctualityRating",      r.getPunctualityRating());
      ratingMap.put("wouldRecommend",         r.getWouldRecommend());
      ratingMap.put("feedback",               r.getFeedback());
      ratingMap.put("improvements",           r.getImprovements());
    }

    // Patient name + image
    String name = c.getProfile() != null
            ? c.getProfile().getFirstName() + " " + c.getProfile().getLastName() : "";
    String patientImageUrl = null;
    if (c.getProfile() != null && c.getProfile().getStudent() != null
            && c.getProfile().getStudent().getUser() != null) {
      patientImageUrl = c.getProfile().getStudent().getUser().getImgUrl();
    }

    return ConsultationResponse.builder()
            .id(c.getId())
            .scheduledAt(c.getScheduledAt() != null ? c.getScheduledAt().toString() : null)
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
            .followUpDate(c.getFollowUpDate() != null ? c.getFollowUpDate().toString() : null)
            .biometricSnapshot(bio.isEmpty() ? null : bio)
            .goalSnapshot(goalSnap)
            .aiSummary(c.getAiSummary())
            .feedback(fb)
            .rating(ratingMap)
            .rejectionReason(c.getRejectionReason())
            .patientName(name)
            .patientImageUrl(patientImageUrl)
            .reminder24hSent(c.getReminder24hSent())
            .reminder1hSent(c.getReminder1hSent())
            .createdAt(c.getCreatedAt().toString())
            .completedAt(c.getCompletedAt() != null ? c.getCompletedAt().toString() : null)
            .build();
  }

  @org.springframework.beans.factory.annotation.Value("${app.mail.test-recipient:}")
  private String testRecipient;

  private void sendEmailIfPossible(Consultation c, String event) {
    try {
      String email = null;
      String name = "Patient";

      if (c.getProfile() != null) {
        name = c.getProfile().getFirstName() + " " + c.getProfile().getLastName();
        if (c.getProfile().getStudent() != null && c.getProfile().getStudent().getUser() != null) {
          email = c.getProfile().getStudent().getUser().getEmail();
        }
      }

      // Fallback to test recipient if real email unavailable
      if (email == null || email.isBlank()) {
        if (testRecipient != null && !testRecipient.isBlank()) {
          log.info("Email: no student email found for consultation {}, using test recipient", c.getId());
          email = testRecipient;
        } else {
          log.warn("Email skipped for event {} on consultation {}: no student email and no test recipient configured", event, c.getId());
          return;
        }
      }

      String doctor = c.getDoctorName();
      String date = c.getScheduledAt().toString().replace("T", " at ");
      switch (event) {
        case "BOOKED"       -> emailService.sendBookingReceived(email, name, doctor, date);
        case "CONFIRMED"    -> emailService.sendBookingConfirmed(email, name, doctor, date);
        case "REJECTED"     -> emailService.sendBookingRejected(email, name, doctor, date, c.getRejectionReason());
        case "REMINDER_24H" -> emailService.sendReminder24h(email, name, doctor, date);
        case "REMINDER_1H"  -> emailService.sendReminder1h(email, name, doctor, date);
      }
    } catch (Exception ex) {
      log.warn("Email not sent for event {} on consultation {}: {}", event, c.getId(), ex.getMessage());
    }
  }

  private void verifyDietitianOwnership(Consultation c, Long dietitianId) {
    // If the consultation has no assigned dietitian, any dietitian may act on it
    if (c.getDietitian() == null) return;
    if (!c.getDietitian().getId().equals(dietitianId))
      throw new RuntimeException("Access denied: consultation does not belong to this dietitian");
  }

  private LocalDateTime parseDateTime(String s) {
    if (s == null) return null;
    // datetime-local sends "2026-03-26T21:15" (no seconds) — append ":00" if needed
    return s.length() == 16 ? LocalDateTime.parse(s + ":00") : LocalDateTime.parse(s);
  }

  private Consultation find(Long id) { return consultRepo.findById(id).orElseThrow(() -> new RuntimeException("Not found")); }

  /** Public accessor used by controllers that need the raw entity (e.g. for slot suggestions). */
  public Consultation findEntity(Long id) { return find(id); }
  // Add to imports at top:
  private final ConsultationRatingRepository ratingRepo;

  @Transactional
  public ConsultationResponse saveRating(Long consultId, Map<String, Object> data) {
    Consultation c = find(consultId);
    ConsultationRating rating = ratingRepo.findByConsultationId(consultId)
            .orElse(ConsultationRating.builder().consultation(c).build());

    rating.setOverallRating(((Number) data.getOrDefault("overallRating", 3)).intValue());
    if (data.containsKey("doctorKnowledgeRating"))
      rating.setDoctorKnowledgeRating(((Number) data.get("doctorKnowledgeRating")).intValue());
    if (data.containsKey("communicationRating"))
      rating.setCommunicationRating(((Number) data.get("communicationRating")).intValue());
    if (data.containsKey("adviceUsefulnessRating"))
      rating.setAdviceUsefulnessRating(((Number) data.get("adviceUsefulnessRating")).intValue());
    if (data.containsKey("punctualityRating"))
      rating.setPunctualityRating(((Number) data.get("punctualityRating")).intValue());
    if (data.containsKey("wouldRecommend"))
      rating.setWouldRecommend((Boolean) data.get("wouldRecommend"));
    if (data.containsKey("feedback"))
      rating.setFeedback((String) data.get("feedback"));
    if (data.containsKey("improvements"))
      rating.setImprovements((String) data.get("improvements"));

    ratingRepo.save(rating);
    return toResponse(consultRepo.findById(consultId).orElseThrow());
  }

  public List<Map<String, Object>> getReminders() {
    LocalDateTime now = LocalDateTime.now();
    List<Map<String, Object>> result = new ArrayList<>();
    consultRepo.findByStatusOrderByScheduledAtAsc("UPCOMING").forEach(c -> {
      long mins = ChronoUnit.MINUTES.between(now, c.getScheduledAt());
      if (mins <= 60 && mins > 0 && c.getReminder1hSent()) {
        result.add(Map.of(
                "type", "1_HOUR",
                "message", "Consultation with Dr. " + c.getDoctorName() + " in " + mins + " minutes",
                "consultationId", c.getId()
        ));
      } else if (mins <= 1440 && mins > 60 && c.getReminder24hSent()) {
        result.add(Map.of(
                "type", "24_HOUR",
                "message", "Consultation with Dr. " + c.getDoctorName() + " tomorrow",
                "consultationId", c.getId()
        ));
      }
    });
    return result;
  }

  public List<tn.esprit.peakwell.entities.Student> getClientsForDietitian(Long dietitianId) {
    return consultRepo.findDistinctStudentsByDietitianId(dietitianId);
  }
}
