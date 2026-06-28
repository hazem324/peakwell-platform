package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.peakwell.dto.HealthGoalRequest;
import tn.esprit.peakwell.dto.HealthGoalResponse;
import tn.esprit.peakwell.dto.HealthGoalResponse.MilestoneResponse;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HealthGoalService {

  private final HealthGoalRepository      goalRepo;
  private final BiometricEntryRepository  biometricRepo;
  private final MedicalProfileRepository  profileRepo;
  private final GoalMilestoneRepository   milestoneRepo;
  private final NotificationService       notificationService;
  private final AuthService               authService;
  private final UserRepository            userRepository;
  private final StudentRepository         studentRepository;
  private final DietitianRepository       dietitianRepository;
  private final ConsultationRepository    consultationRepo;

  // ── Current-user resolution helpers ─────────────

  /** Resolves the medical-profile ID of the authenticated patient. Returns null if not found. */
  private Long resolveCurrentProfileId() {
    try {
      String keycloakId = authService.getCurrentUserId();
      User user = userRepository.findByKeycloakId(keycloakId).orElse(null);
      if (user == null) return null;
      return profileRepo.findByStudentId(user.getId())
              .map(MedicalProfile::getId)
              .orElse(null);
    } catch (Exception e) {
      return null;
    }
  }

  /** Resolves the Dietitian entity for the currently authenticated nutritionist. Returns null if not found. */
  private Dietitian resolveCurrentDietitian() {
    try {
      String keycloakId = authService.getCurrentUserId();
      User user = userRepository.findByKeycloakId(keycloakId).orElse(null);
      if (user == null) return null;
      return dietitianRepository.findByUserId(user.getId()).orElse(null);
    } catch (Exception e) {
      return null;
    }
  }

  // ── CRUD ────────────────────────────────────────

  /** Returns only the goals belonging to the currently authenticated patient. */
  public List<HealthGoalResponse> getAllGoals() {
    Long profileId = resolveCurrentProfileId();
    if (profileId == null) return List.of();
    List<HealthGoal> goals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(profileId);
    updateAllMilestones(goals);
    return goals.stream().map(this::toResponse).collect(Collectors.toList());
  }

  /** Returns active goals for the currently authenticated patient. */
  public List<HealthGoalResponse> getActiveGoals() {
    Long profileId = resolveCurrentProfileId();
    if (profileId == null) return List.of();
    List<HealthGoal> goals = goalRepo.findByActiveTrueAndProfileIdOrderByCreatedAtDesc(profileId);
    updateAllMilestones(goals);
    return goals.stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional
  public HealthGoalResponse createGoal(HealthGoalRequest request) {
    Long profileId = resolveCurrentProfileId();
    MedicalProfile profile = profileId != null
            ? profileRepo.findById(profileId).orElse(null)
            : null;

    HealthGoal goal = HealthGoal.builder()
            .profile(profile)
            .metric(request.getMetric())
            .direction(request.getDirection())
            .startValue(request.getStartValue())
            .targetValue(request.getTargetValue())
            .unit(request.getUnit())
            .deadline(LocalDate.parse(request.getDeadline()))
            .build();

    List<GoalMilestone> milestones = (request.getCustomMilestones() != null && !request.getCustomMilestones().isEmpty())
            ? request.getCustomMilestones().stream()
            .map(cm -> GoalMilestone.builder().goal(goal).label(cm.getLabel()).targetValue(cm.getTargetValue()).reached(false).build())
            .collect(Collectors.toList())
            : generateMilestones(goal, request.getStartValue(), request.getTargetValue());
    goal.setMilestones(milestones);

    HealthGoal saved = goalRepo.save(goal);
    updateMilestones(saved);
    return toResponse(goalRepo.save(saved));
  }

  @Transactional
  public void deleteGoal(Long id) {
    goalRepo.deleteById(id);
  }

  @Transactional
  public HealthGoalResponse deactivateGoal(Long id) {
    HealthGoal goal = goalRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Goal not found"));
    goal.setActive(false);
    return toResponse(goalRepo.save(goal));
  }

  @Transactional
  public HealthGoalResponse pauseGoal(Long id, String reason) {
    HealthGoal goal = goalRepo.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));
    goal.setPaused(true);
    goal.setPauseReason(reason);
    HealthGoal saved = goalRepo.save(goal);

    MedicalProfile profile = saved.getProfile();
    if (profile != null && profile.getAssignedDietitian() != null) {
      String patientName = ((profile.getFirstName() != null ? profile.getFirstName() : "")
              + " " + (profile.getLastName() != null ? profile.getLastName() : "")).trim();
      notificationService.notifyGoalPaused(profile.getAssignedDietitian(), patientName, saved.getMetric(), reason);
    }

    return toResponse(saved);
  }

  @Transactional
  public HealthGoalResponse resumeGoal(Long id) {
    HealthGoal goal = goalRepo.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));
    goal.setPaused(false);
    goal.setPauseReason(null);
    return toResponse(goalRepo.save(goal));
  }

  @Transactional
  public HealthGoalResponse editGoal(Long id, Double targetValue, String deadline) {
    HealthGoal goal = goalRepo.findById(id).orElseThrow(() -> new RuntimeException("Goal not found"));
    if (targetValue != null) goal.setTargetValue(targetValue);
    if (deadline != null) goal.setDeadline(LocalDate.parse(deadline));
    return toResponse(goalRepo.save(goal));
  }

  @Transactional
  public HealthGoalResponse createGoalForProfile(Long profileId, HealthGoalRequest request, String dietitianName) {
    MedicalProfile profile = profileRepo.findById(profileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

    // Validate that the current nutritionist has an active (non-cancelled) consultation with this patient
    Dietitian dietitian = resolveCurrentDietitian();
    if (dietitian != null) {
      boolean hasActiveRelationship = consultationRepo
              .existsByProfileIdAndDietitianIdAndStatusNot(profileId, dietitian.getId(), "CANCELLED");
      if (!hasActiveRelationship) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "No active consultation relationship with this patient");
      }
    }

    HealthGoal goal = HealthGoal.builder()
            .profile(profile)
            .metric(request.getMetric())
            .direction(request.getDirection())
            .startValue(request.getStartValue())
            .targetValue(request.getTargetValue())
            .unit(request.getUnit())
            .deadline(LocalDate.parse(request.getDeadline()))
            .assignedByDietitian(true)
            .assignedByDietitianName(dietitianName)
            .build();

    List<GoalMilestone> milestones = (request.getCustomMilestones() != null && !request.getCustomMilestones().isEmpty())
            ? request.getCustomMilestones().stream()
            .map(cm -> GoalMilestone.builder().goal(goal).label(cm.getLabel()).targetValue(cm.getTargetValue()).reached(false).build())
            .collect(Collectors.toList())
            : generateMilestones(goal, request.getStartValue(), request.getTargetValue());
    goal.setMilestones(milestones);

    HealthGoal saved = goalRepo.save(goal);
    notificationService.notifyGoalAssigned(profile, request.getMetric(), dietitianName);
    return toResponse(saved);
  }

  public List<HealthGoalResponse> getGoalsForProfile(Long profileId) {
    List<HealthGoal> goals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(profileId);
    updateAllMilestones(goals);
    return goals.stream().map(this::toResponse).collect(Collectors.toList());
  }

  @Transactional
  public MilestoneResponse addMilestoneNote(Long milestoneId, String note) {
    GoalMilestone m = milestoneRepo.findById(milestoneId)
            .orElseThrow(() -> new RuntimeException("Milestone not found"));
    m.setNote(note);
    milestoneRepo.save(m);
    return MilestoneResponse.builder()
            .id(m.getId()).label(m.getLabel()).targetValue(m.getTargetValue())
            .reached(m.getReached()).reachedDate(m.getReachedDate()).note(m.getNote())
            .build();
  }

  public Map<String, Object> getChartData(Long goalId) {
    HealthGoal goal = goalRepo.findById(goalId).orElseThrow(() -> new RuntimeException("Goal not found"));
    List<BiometricEntry> entries = biometricRepo.findAllByProfileIdOrderByRecordedAtAsc(goal.getProfile().getId());

    LocalDate goalStart = goal.getCreatedAt().toLocalDate();
    DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

    List<Map<String, Object>> points = entries.stream()
            .filter(e -> !e.getRecordedAt().toLocalDate().isBefore(goalStart))
            .map(e -> {
              Double val = getMetricValueFromEntry(goal.getMetric(), e);
              Map<String, Object> point = new LinkedHashMap<>();
              point.put("date", e.getRecordedAt().toLocalDate().format(fmt));
              point.put("value", val);
              return point;
            })
            .filter(p -> p.get("value") != null)
            .collect(Collectors.toList());

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("points", points);
    result.put("startValue", goal.getStartValue());
    result.put("targetValue", goal.getTargetValue());
    result.put("deadline", goal.getDeadline().format(fmt));
    result.put("unit", goal.getUnit());
    return result;
  }

  private Double getMetricValueFromEntry(String metric, BiometricEntry e) {
    return switch (metric) {
      case "weight"     -> e.getWeight();
      case "bmi"        -> e.getBmi();
      case "bodyFat"    -> e.getBodyFat();
      case "muscleMass" -> e.getMuscleMass();
      case "systolic"   -> e.getSystolic() != null ? e.getSystolic().doubleValue() : null;
      case "glucose"    -> e.getGlucose();
      default           -> null;
    };
  }

  // ── Milestone Logic ─────────────────────────────

  private List<GoalMilestone> generateMilestones(HealthGoal goal, double start, double target) {
    List<GoalMilestone> milestones = new ArrayList<>();
    double diff = target - start;
    double[] steps = {0.25, 0.5, 0.75, 1.0};
    String[] labels = {"25% milestone", "50% — halfway!", "75% milestone", "Goal reached!"};

    for (int i = 0; i < steps.length; i++) {
      double value = Math.round((start + diff * steps[i]) * 100.0) / 100.0;
      milestones.add(GoalMilestone.builder()
              .goal(goal)
              .label(labels[i])
              .targetValue(value)
              .reached(false)
              .build());
    }
    return milestones;
  }

  private void updateAllMilestones(List<HealthGoal> goals) {
    boolean anyChanged = false;
    for (HealthGoal goal : goals) {
      if (goal.getActive() && !goal.getAchieved() && !Boolean.TRUE.equals(goal.getPaused())) {
        boolean changed = updateMilestones(goal);
        if (changed) anyChanged = true;
      }
    }
    if (anyChanged) {
      goalRepo.saveAll(goals);
    }
  }

  private boolean updateMilestones(HealthGoal goal) {
    // Use the profile-scoped latest biometric — not the global one
    Long profileId = goal.getProfile() != null ? goal.getProfile().getId() : null;
    Double currentValue = getCurrentMetricValue(goal.getMetric(), profileId);
    if (currentValue == null) return false;

    boolean changed = false;
    String today = LocalDate.now().format(DateTimeFormatter.ofPattern("MMM d"));

    for (GoalMilestone m : goal.getMilestones()) {
      boolean shouldBeReached = "decrease".equals(goal.getDirection())
              ? currentValue <= m.getTargetValue()
              : currentValue >= m.getTargetValue();

      if (shouldBeReached && !m.getReached()) {
        m.setReached(true);
        m.setReachedDate(today);
        changed = true;
      }
    }

    boolean allReached = goal.getMilestones().stream().allMatch(GoalMilestone::getReached);
    if (allReached && !goal.getAchieved()) {
      goal.setAchieved(true);
      goal.setAchievedDate(LocalDate.now());
      changed = true;
      if (Boolean.TRUE.equals(goal.getAssignedByDietitian()) && goal.getProfile() != null) {
        MedicalProfile p = goal.getProfile();
        String patientName = ((p.getFirstName() != null ? p.getFirstName() : "")
                + " " + (p.getLastName() != null ? p.getLastName() : "")).trim();
        if (p.getAssignedDietitian() != null) {
          notificationService.notifyGoalAchieved(p.getAssignedDietitian(), patientName, goal.getMetric());
        }
      }
    }

    return changed;
  }

  /** Returns the latest metric value scoped to the given profile. */
  private Double getCurrentMetricValue(String metric, Long profileId) {
    if (profileId == null) return null;
    return biometricRepo.findTopByProfileIdOrderByRecordedAtDesc(profileId)
            .map(entry -> getMetricValueFromEntry(metric, entry))
            .orElse(null);
  }

  // ── Mapper ──────────────────────────────────────

  private HealthGoalResponse toResponse(HealthGoal goal) {
    Long profileId = goal.getProfile() != null ? goal.getProfile().getId() : null;
    Double currentValue = getCurrentMetricValue(goal.getMetric(), profileId);

    return HealthGoalResponse.builder()
            .id(goal.getId())
            .metric(goal.getMetric())
            .direction(goal.getDirection())
            .startValue(goal.getStartValue())
            .targetValue(goal.getTargetValue())
            .unit(goal.getUnit())
            .deadline(goal.getDeadline().toString())
            .active(goal.getActive())
            .achieved(goal.getAchieved())
            .achievedDate(goal.getAchievedDate() != null ? goal.getAchievedDate().toString() : null)
            .createdAt(goal.getCreatedAt() != null ? goal.getCreatedAt().toString() : null)
            .paused(goal.getPaused())
            .pauseReason(goal.getPauseReason())
            .assignedByDietitian(goal.getAssignedByDietitian())
            .assignedByDietitianName(goal.getAssignedByDietitianName())
            .milestones(goal.getMilestones() != null
                    ? goal.getMilestones().stream()
                    .map(m -> MilestoneResponse.builder()
                            .id(m.getId())
                            .label(m.getLabel())
                            .targetValue(m.getTargetValue())
                            .reached(m.getReached())
                            .reachedDate(m.getReachedDate())
                            .note(m.getNote())
                            .build())
                    .collect(Collectors.toList())
                    : List.of())
            .build();
  }
}
