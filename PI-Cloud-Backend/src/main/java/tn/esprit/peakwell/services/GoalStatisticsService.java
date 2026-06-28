package tn.esprit.peakwell.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.entities.BiometricEntry;
import tn.esprit.peakwell.entities.HealthGoal;
import tn.esprit.peakwell.entities.MedicalProfile;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.repositories.BiometricEntryRepository;
import tn.esprit.peakwell.repositories.HealthGoalRepository;
import tn.esprit.peakwell.repositories.MedicalProfileRepository;
import tn.esprit.peakwell.repositories.UserRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class GoalStatisticsService {

  private final HealthGoalRepository goalRepo;
  private final BiometricEntryRepository biometricRepo;
  private final MedicalProfileRepository profileRepo;
  private final UserRepository userRepository;
  private final AuthService authService;

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

  public Map<String, Object> getStatistics() {
    Long profileId = resolveCurrentProfileId();
    if (profileId == null) return Map.of("totalGoals", 0);

    List<HealthGoal> allGoals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(profileId);
    BiometricEntry latest = biometricRepo.findTopByProfileIdOrderByRecordedAtDesc(profileId).orElse(null);

    Map<String, Object> stats = new LinkedHashMap<>();

    // ── KPI Summary ─────────────────────────────
    stats.put("totalGoals", allGoals.size());
    stats.put("activeGoals", allGoals.stream().filter(g -> g.getActive() != null && g.getActive()).count());
    stats.put("achievedGoals", allGoals.stream().filter(g -> g.getAchieved() != null && g.getAchieved()).count());
    stats.put("failedGoals", allGoals.stream().filter(g -> !isActive(g) && !isAchieved(g) && isPastDeadline(g)).count());

    // ── Completion Rate ─────────────────────────
    long completed = allGoals.stream().filter(this::isAchieved).count();
    long expired = allGoals.stream().filter(g -> !isActive(g) && isPastDeadline(g)).count();
    long finishedTotal = completed + expired;
    double completionRate = finishedTotal > 0 ? Math.round(completed * 1000.0 / finishedTotal) / 10.0 : 0;
    stats.put("completionRate", completionRate);

    // ── Average Time to Achieve (days) ──────────
    List<Long> achieveTimes = allGoals.stream()
            .filter(this::isAchieved)
            .filter(g -> g.getAchievedDate() != null && g.getCreatedAt() != null)
            .map(g -> ChronoUnit.DAYS.between(g.getCreatedAt(), g.getAchievedDate().atStartOfDay()))
            .filter(d -> d > 0)
            .collect(Collectors.toList());
    double avgDaysToAchieve = achieveTimes.isEmpty() ? 0 :
            Math.round(achieveTimes.stream().mapToLong(Long::longValue).average().orElse(0) * 10.0) / 10.0;
    stats.put("avgDaysToAchieve", avgDaysToAchieve);
    stats.put("fastestAchieve", achieveTimes.isEmpty() ? 0 : Collections.min(achieveTimes));
    stats.put("slowestAchieve", achieveTimes.isEmpty() ? 0 : Collections.max(achieveTimes));

    // ── Per-Metric Breakdown ────────────────────
    Map<String, List<HealthGoal>> byMetric = allGoals.stream()
            .collect(Collectors.groupingBy(g -> g.getMetric() != null ? g.getMetric() : "unknown"));

    List<Map<String, Object>> metricStats = new ArrayList<>();
    for (Map.Entry<String, List<HealthGoal>> entry : byMetric.entrySet()) {
      String metric = entry.getKey();
      List<HealthGoal> goals = entry.getValue();
      long metricAchieved = goals.stream().filter(this::isAchieved).count();
      long metricTotal = goals.size();
      double metricRate = metricTotal > 0 ? Math.round(metricAchieved * 1000.0 / metricTotal) / 10.0 : 0;

      Double currentValue = getCurrentValue(metric, latest);

      Map<String, Object> ms = new LinkedHashMap<>();
      ms.put("metric", metric);
      ms.put("icon", getMetricIcon(metric));
      ms.put("unit", getMetricUnit(metric));
      ms.put("total", metricTotal);
      ms.put("achieved", metricAchieved);
      ms.put("active", goals.stream().filter(this::isActive).count());
      ms.put("completionRate", metricRate);
      ms.put("currentValue", currentValue);

      List<Double> progresses = goals.stream()
              .filter(this::isActive)
              .map(g -> calculateProgress(g, currentValue))
              .filter(Objects::nonNull)
              .collect(Collectors.toList());
      ms.put("avgProgress", progresses.isEmpty() ? 0 :
              Math.round(progresses.stream().mapToDouble(Double::doubleValue).average().orElse(0) * 10.0) / 10.0);

      metricStats.add(ms);
    }
    metricStats.sort((a, b) -> Double.compare(
            (double) b.getOrDefault("completionRate", 0.0),
            (double) a.getOrDefault("completionRate", 0.0)));
    stats.put("metricBreakdown", metricStats);

    // ── Best & Worst Metric ─────────────────────
    if (!metricStats.isEmpty()) {
      stats.put("bestMetric", metricStats.get(0));
      stats.put("worstMetric", metricStats.get(metricStats.size() - 1));
    }

    // ── Monthly Trend ──────────────────────────
    Map<String, int[]> monthlyMap = new TreeMap<>();
    for (HealthGoal g : allGoals) {
      if (g.getCreatedAt() != null) {
        String key = g.getCreatedAt().getYear() + "-" +
                String.format("%02d", g.getCreatedAt().getMonthValue());
        monthlyMap.computeIfAbsent(key, k -> new int[2])[0]++;
      }
      if (isAchieved(g) && g.getAchievedDate() != null) {
        String key = g.getAchievedDate().getYear() + "-" +
                String.format("%02d", g.getAchievedDate().getMonthValue());
        monthlyMap.computeIfAbsent(key, k -> new int[2])[1]++;
      }
    }
    List<Map<String, Object>> monthlyTrend = new ArrayList<>();
    for (Map.Entry<String, int[]> e : monthlyMap.entrySet()) {
      monthlyTrend.add(Map.of(
              "month", e.getKey(),
              "created", e.getValue()[0],
              "achieved", e.getValue()[1]
      ));
    }
    stats.put("monthlyTrend", monthlyTrend);

    // ── Active Goals with Progress ──────────────
    List<Map<String, Object>> activeGoalDetails = allGoals.stream()
            .filter(this::isActive)
            .map(g -> {
              Map<String, Object> gd = new LinkedHashMap<>();
              gd.put("id", g.getId());
              gd.put("metric", g.getMetric());
              gd.put("icon", getMetricIcon(g.getMetric()));
              gd.put("direction", g.getDirection());
              gd.put("startValue", g.getStartValue());
              gd.put("targetValue", g.getTargetValue());
              gd.put("unit", g.getUnit());
              gd.put("deadline", g.getDeadline() != null ? g.getDeadline().toString() : null);
              gd.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : null);

              Double current = getCurrentValue(g.getMetric(), latest);
              gd.put("currentValue", current);
              gd.put("progress", calculateProgress(g, current));

              if (g.getDeadline() != null) {
                long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), g.getDeadline());
                gd.put("daysRemaining", Math.max(0, daysLeft));
                gd.put("isOverdue", daysLeft < 0);
                if (g.getCreatedAt() != null) {
                  long totalDays = ChronoUnit.DAYS.between(g.getCreatedAt().toLocalDate(), g.getDeadline());
                  gd.put("totalDays", totalDays);
                  gd.put("elapsedPct", totalDays > 0 ?
                          Math.round(Math.min(100, (totalDays - daysLeft) * 100.0 / totalDays) * 10.0) / 10.0 : 100);
                }
              }

              Double progress = calculateProgress(g, getCurrentValue(g.getMetric(), latest));
              gd.put("status", getGoalStatus(g, progress));

              return gd;
            })
            .collect(Collectors.toList());
    stats.put("activeGoalDetails", activeGoalDetails);

    // ── Achievement History (last 10 achieved) ──
    List<Map<String, Object>> achievementHistory = allGoals.stream()
            .filter(this::isAchieved)
            .sorted((a, b) -> {
              LocalDate da = a.getAchievedDate() != null ? a.getAchievedDate() : LocalDate.MIN;
              LocalDate db = b.getAchievedDate() != null ? b.getAchievedDate() : LocalDate.MIN;
              return db.compareTo(da);
            })
            .limit(10)
            .map(g -> {
              Map<String, Object> ah = new LinkedHashMap<>();
              ah.put("metric", g.getMetric());
              ah.put("icon", getMetricIcon(g.getMetric()));
              ah.put("direction", g.getDirection());
              ah.put("startValue", g.getStartValue());
              ah.put("targetValue", g.getTargetValue());
              ah.put("unit", g.getUnit());
              ah.put("achievedDate", g.getAchievedDate() != null ? g.getAchievedDate().toString() : null);
              ah.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : null);
              if (g.getAchievedDate() != null && g.getCreatedAt() != null) {
                ah.put("daysToAchieve", ChronoUnit.DAYS.between(g.getCreatedAt(), g.getAchievedDate().atStartOfDay()));
              }
              return ah;
            })
            .collect(Collectors.toList());
    stats.put("achievementHistory", achievementHistory);

    return stats;
  }

  // ── Helpers ──────────────────────────────────────

  private boolean isActive(HealthGoal g) { return g.getActive() != null && g.getActive(); }
  private boolean isAchieved(HealthGoal g) { return g.getAchieved() != null && g.getAchieved(); }
  private boolean isPastDeadline(HealthGoal g) {
    return g.getDeadline() != null && g.getDeadline().isBefore(LocalDate.now());
  }

  private Double calculateProgress(HealthGoal g, Double currentValue) {
    if (currentValue == null || g.getStartValue() == null || g.getTargetValue() == null) return null;
    if (g.getStartValue().equals(g.getTargetValue())) return 100.0;

    double progress;
    if ("decrease".equalsIgnoreCase(g.getDirection())) {
      progress = (g.getStartValue() - currentValue) / (g.getStartValue() - g.getTargetValue()) * 100;
    } else {
      progress = (currentValue - g.getStartValue()) / (g.getTargetValue() - g.getStartValue()) * 100;
    }
    return Math.round(Math.min(100, Math.max(0, progress)) * 10.0) / 10.0;
  }

  private String getGoalStatus(HealthGoal g, Double progress) {
    if (progress == null) return "No data";
    if (progress >= 100) return "Achieved";
    if (progress >= 75) return "Almost there";
    if (g.getDeadline() != null && g.getDeadline().isBefore(LocalDate.now())) return "Overdue";
    if (progress >= 40) return "On track";
    if (progress >= 10) return "Needs effort";
    return "Just started";
  }

  private Double getCurrentValue(String metric, BiometricEntry latest) {
    if (latest == null || metric == null) return null;
    return switch (metric.toLowerCase()) {
      case "weight" -> latest.getWeight();
      case "bmi" -> latest.getBmi();
      case "bodyfat", "body_fat" -> latest.getBodyFat();
      case "musclemass", "muscle_mass" -> latest.getMuscleMass();
      case "systolic" -> latest.getSystolic() != null ? latest.getSystolic().doubleValue() : null;
      case "glucose" -> latest.getGlucose();
      default -> null;
    };
  }

  private String getMetricIcon(String metric) {
    if (metric == null) return "🎯";
    return switch (metric.toLowerCase()) {
      case "weight" -> "⚖️";
      case "bmi" -> "📏";
      case "bodyfat", "body_fat" -> "🔬";
      case "musclemass", "muscle_mass" -> "💪";
      case "systolic" -> "❤️";
      case "glucose" -> "🩸";
      default -> "🎯";
    };
  }

  private String getMetricUnit(String metric) {
    if (metric == null) return "";
    return switch (metric.toLowerCase()) {
      case "weight" -> "kg";
      case "bmi" -> "";
      case "bodyfat", "body_fat" -> "%";
      case "musclemass", "muscle_mass" -> "kg";
      case "systolic" -> "mmHg";
      case "glucose" -> "mg/dL";
      default -> "";
    };
  }
}
