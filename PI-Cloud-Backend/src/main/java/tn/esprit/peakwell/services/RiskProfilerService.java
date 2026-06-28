package tn.esprit.peakwell.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.*;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RiskProfilerService {

  private final BiometricEntryRepository biometricRepo;
  private final SymptomEntryRepository symptomRepo;
  private final HealthGoalRepository goalRepo;
  private final ConsultationRepository consultRepo;
  private final MedicalProfileRepository profileRepo;

  private JsonNode modelData;
  private List<String> featureColumns;
  private List<String> riskTiers;
  private boolean modelLoaded = false;

  public RiskProfilerService(BiometricEntryRepository biometricRepo, SymptomEntryRepository symptomRepo,
                             HealthGoalRepository goalRepo, ConsultationRepository consultRepo,
                             MedicalProfileRepository profileRepo) {
    this.biometricRepo = biometricRepo;
    this.symptomRepo = symptomRepo;
    this.goalRepo = goalRepo;
    this.consultRepo = consultRepo;
    this.profileRepo = profileRepo;
  }

  @PostConstruct
  public void loadModel() {
    try {
      ClassPathResource resource = new ClassPathResource("ml/risk_profiler_model.json");
      InputStream is = resource.getInputStream();
      modelData = new ObjectMapper().readTree(is);
      featureColumns = new ArrayList<>();
      modelData.get("features").forEach(f -> featureColumns.add(f.asText()));
      riskTiers = new ArrayList<>();
      modelData.get("risk_tiers").forEach(t -> riskTiers.add(t.asText()));
      modelLoaded = true;
      log.info("Risk Profiler loaded: {} trees, {} features", modelData.get("n").asInt(), featureColumns.size());
    } catch (Exception e) {
      log.warn("Risk profiler model not found: {}", e.getMessage());
    }
  }

  public boolean isModelLoaded() { return modelLoaded; }

  // ── Profile ALL patients (for dietitian dashboard) ──

  public List<Map<String, Object>> profileAllPatients() {
    if (!modelLoaded) return List.of(Map.of("error", "Model not loaded"));

    List<MedicalProfile> allProfiles = profileRepo.findAll();
    return allProfiles.stream()
      .map(p -> profilePatient(p.getId()))
      .sorted((a, b) -> Integer.compare(
        (int) b.getOrDefault("riskLevel", 0),
        (int) a.getOrDefault("riskLevel", 0)))
      .collect(Collectors.toList());
  }

  // ── Profile a single patient by ID ──

  public Map<String, Object> profilePatient(Long profileId) {
    Map<String, Object> result = new LinkedHashMap<>();
    if (!modelLoaded) { result.put("error", "Model not loaded"); return result; }

    MedicalProfile profile = profileRepo.findById(profileId).orElse(null);
    if (profile == null) { result.put("error", "Profile not found"); return result; }

    Map<String, Object> features = gatherFeatures(profile);
    double[] featureArray = buildFeatureArray(features);

    // Run model
    int nTrees = modelData.get("n").asInt();
    JsonNode trees = modelData.get("trees");
    int[] votes = new int[4];
    for (int i = 0; i < nTrees; i++) {
      int p = traverse(trees.get(i), featureArray);
      if (p >= 0 && p < 4) votes[p]++;
    }

    int best = 0; int maxV = 0;
    for (int c = 0; c < 4; c++) if (votes[c] > maxV) { maxV = votes[c]; best = c; }

    Map<String, Double> probs = new LinkedHashMap<>();
    for (int c = 0; c < 4; c++)
      probs.put(riskTiers.get(c), Math.round((double) votes[c] / nTrees * 1000.0) / 10.0);

    double confidence = Math.round((double) maxV / nTrees * 1000.0) / 10.0;

    // Patient info
    result.put("profileId", profileId);
    result.put("patientName", (profile.getFirstName() != null ? profile.getFirstName() : "") + " " +
      (profile.getLastName() != null ? profile.getLastName() : ""));
    result.put("patientInitials", ((profile.getFirstName() != null ? profile.getFirstName().substring(0, 1) : "") +
      (profile.getLastName() != null ? profile.getLastName().substring(0, 1) : "")).toUpperCase());
    result.put("gender", profile.getGender());

    // Risk result
    result.put("riskTier", riskTiers.get(best));
    result.put("riskLevel", best);
    result.put("confidence", confidence);
    result.put("probabilities", probs);
    result.put("recommendation", getRecommendation(best));
    result.put("schedulingAdvice", getSchedulingAdvice(best));
    result.put("riskFactors", identifyRiskFactors(features));
    result.put("protectiveFactors", identifyProtectiveFactors(features));
    result.put("breakdown", buildBreakdown(features));

    return result;
  }

  // ── Data gathering ──────────────────────────────

  private Map<String, Object> gatherFeatures(MedicalProfile profile) {
    Map<String, Object> f = new LinkedHashMap<>();
    Long pid = profile.getId();

    List<BiometricEntry> entries = biometricRepo.findAllByProfileIdOrderByRecordedAtAsc(pid);
    List<SymptomEntry> symptoms = symptomRepo.findTop10ByProfileIdOrderByLogDateDesc(pid);
    List<HealthGoal> goals = goalRepo.findAllByProfileIdOrderByCreatedAtDesc(pid);
    List<Consultation> consults = consultRepo.findAllByProfileIdOrderByScheduledAtDesc(pid);

    // Demographics
    long age = 30;
    if (profile.getDateOfBirth() != null) {
      try {
        LocalDate dob = LocalDate.parse(profile.getDateOfBirth(),
          DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        age = ChronoUnit.YEARS.between(dob, LocalDate.now());
      } catch (Exception e) {
        try {
          LocalDate dob = LocalDate.parse(profile.getDateOfBirth());
          age = ChronoUnit.YEARS.between(dob, LocalDate.now());
        } catch (Exception e2) {
          age = 30;
        }
      }
    }
    f.put("age", age);
    f.put("gender", "Male".equalsIgnoreCase(profile.getGender()) ? 1 : 0);

    // Latest biometrics
    BiometricEntry latest = entries.isEmpty() ? null : entries.get(entries.size() - 1);
    f.put("bmi", latest != null ? latest.getBmi() : 25.0);
    f.put("systolic", latest != null && latest.getSystolic() != null ? latest.getSystolic() : 120);
    f.put("diastolic", latest != null && latest.getDiastolic() != null ? latest.getDiastolic() : 80);
    f.put("glucose", latest != null && latest.getGlucose() != null ? latest.getGlucose() : 95);
    f.put("body_fat", latest != null && latest.getBodyFat() != null ? latest.getBodyFat() : 22);
    f.put("muscle_mass", latest != null && latest.getMuscleMass() != null ? latest.getMuscleMass() : 35);

    // Trends
    if (entries.size() >= 2) {
      BiometricEntry first = entries.get(0);
      BiometricEntry last = entries.get(entries.size() - 1);
      f.put("weight_trend", round(last.getWeight() - first.getWeight()));
      f.put("bmi_trend", round(last.getBmi() - first.getBmi()));
      f.put("bp_trend", last.getSystolic() != null && first.getSystolic() != null ?
        last.getSystolic() - first.getSystolic() : 0);
      f.put("glucose_trend", last.getGlucose() != null && first.getGlucose() != null ?
        round(last.getGlucose() - first.getGlucose()) : 0);
    } else {
      f.put("weight_trend", 0); f.put("bmi_trend", 0); f.put("bp_trend", 0); f.put("glucose_trend", 0);
    }

    // Conditions
    Set<String> conditions = profile.getConditions() != null ? new HashSet<>(profile.getConditions()) : new HashSet<>();
    f.put("has_hypertension", conditions.stream().anyMatch(c -> c.toLowerCase().contains("hypertension")) ? 1 : 0);
    f.put("has_diabetes", conditions.stream().anyMatch(c -> c.toLowerCase().contains("diabetes")) ? 1 : 0);
    f.put("has_obesity", latest != null && latest.getBmi() > 30 ? 1 : 0);
    f.put("has_heart_disease", conditions.stream().anyMatch(c -> c.toLowerCase().contains("heart")) ? 1 : 0);
    f.put("has_kidney_issue", conditions.stream().anyMatch(c -> c.toLowerCase().contains("kidney")) ? 1 : 0);
    f.put("condition_count", toInt(f, "has_hypertension") + toInt(f, "has_diabetes") + toInt(f, "has_obesity") +
      toInt(f, "has_heart_disease") + toInt(f, "has_kidney_issue"));

    // Symptoms
    f.put("symptom_count_30d", symptoms.size());
    f.put("avg_symptom_severity", symptoms.isEmpty() ? 0 :
      round(symptoms.stream().mapToInt(SymptomEntry::getSeverity).average().orElse(0)));
    f.put("severe_symptom_count", symptoms.stream().filter(s -> s.getSeverity() >= 7).count());
    f.put("symptom_variety", symptoms.stream().map(SymptomEntry::getSymptom).distinct().count());
    f.put("worst_symptom_severity", symptoms.stream().mapToInt(SymptomEntry::getSeverity).max().orElse(0));

    // Goals
    List<HealthGoal> activeGoals = goals.stream().filter(g -> g.getActive() != null && g.getActive()).toList();
    f.put("active_goals", activeGoals.size());
    f.put("goals_achieved_pct", goals.isEmpty() ? 100 :
      round(goals.stream().filter(g -> g.getAchieved() != null && g.getAchieved()).count() * 100.0 / goals.size()));
    f.put("goals_on_track", activeGoals.stream().anyMatch(g -> g.getAchieved() != null && g.getAchieved()) ? 1 : 0);
    f.put("days_since_goal_update", goals.isEmpty() ? 30 : 5);

    // Consultations
    f.put("total_consultations", consults.size());
    long recent = consults.stream().filter(c -> c.getScheduledAt().isAfter(LocalDateTime.now().minusDays(90))).count();
    f.put("consultations_last_90d", recent);
    f.put("days_since_last_consult", consults.isEmpty() ? 60 :
      ChronoUnit.DAYS.between(consults.get(0).getScheduledAt(), LocalDateTime.now()));
    long missed = consults.stream().filter(c -> "CANCELLED".equals(c.getStatus())).count();
    f.put("missed_consultations", missed);
    f.put("consult_completion_rate", consults.isEmpty() ? 100 :
      round((consults.size() - missed) * 100.0 / consults.size()));

    // Defaults for engagement
    f.put("avg_feedback_rating", 3.5);
    f.put("advice_followed_pct", 60.0);
    f.put("symptoms_improved_pct", 50.0);
    f.put("days_since_last_entry", entries.isEmpty() ? 30 :
      ChronoUnit.DAYS.between(entries.get(entries.size() - 1).getRecordedAt(), LocalDateTime.now()));
    f.put("exercise_hrs_weekly", 3.0);
    f.put("sleep_avg_hrs", 7.0);
    f.put("stress_level_avg", 3.0);

    // Engineered
    double hs = 100 - (Math.min(Math.max((toDouble(f, "bmi") - 22) * 2, 0), 20) +
      Math.min(Math.max((toDouble(f, "systolic") - 120) * 0.2, 0), 15) +
      Math.min(Math.max((toDouble(f, "glucose") - 90) * 0.15, 0), 15) +
      toInt(f, "condition_count") * 8 +
      Math.min(toDouble(f, "avg_symptom_severity") * 2, 15));
    f.put("health_score", round(Math.max(0, Math.min(100, hs))));

    double es = toDouble(f, "advice_followed_pct") * 0.3 +
      toDouble(f, "consult_completion_rate") * 0.2 +
      toDouble(f, "goals_achieved_pct") * 0.2 +
      (100 - Math.min(toDouble(f, "days_since_last_entry"), 100)) * 0.15 +
      toDouble(f, "avg_feedback_rating") * 20 * 0.15;
    f.put("engagement_score", round(Math.max(0, Math.min(100, es))));

    double ds = Math.max(toDouble(f, "weight_trend"), 0) * 2 +
      Math.max(toDouble(f, "bp_trend"), 0) * 0.5 +
      Math.max(toDouble(f, "glucose_trend"), 0) * 0.3 +
      toLong(f, "severe_symptom_count") * 3 +
      toLong(f, "missed_consultations") * 5;
    f.put("deterioration_signal", round(Math.max(0, Math.min(50, ds))));

    return f;
  }

  private String getRecommendation(int tier) {
    return switch (tier) {
      case 0 -> "Patient is in good health. Continue current routine.";
      case 1 -> "Some health areas need attention. Closer monitoring recommended.";
      case 2 -> "Multiple risk factors. Increase consultation frequency.";
      case 3 -> "Critical risk. Immediate intervention required.";
      default -> "";
    };
  }

  private Map<String, Object> getSchedulingAdvice(int tier) {
    return switch (tier) {
      case 0 -> Map.of("frequency", "Every 2-3 months", "priority", "LOW", "nextIn", "60-90 days");
      case 1 -> Map.of("frequency", "Monthly", "priority", "NORMAL", "nextIn", "30 days");
      case 2 -> Map.of("frequency", "Every 2 weeks", "priority", "URGENT", "nextIn", "14 days");
      case 3 -> Map.of("frequency", "Weekly", "priority", "URGENT", "nextIn", "7 days or less");
      default -> Map.of();
    };
  }

  private List<Map<String, Object>> identifyRiskFactors(Map<String, Object> f) {
    List<Map<String, Object>> factors = new ArrayList<>();
    if (toDouble(f, "bmi") > 30) factors.add(Map.of("factor", "Obesity (BMI " + f.get("bmi") + ")", "category", "Biometric", "impact", "High"));
    if (toDouble(f, "systolic") > 140) factors.add(Map.of("factor", "Hypertension (BP " + f.get("systolic") + ")", "category", "Biometric", "impact", "High"));
    if (toDouble(f, "glucose") > 126) factors.add(Map.of("factor", "Diabetic glucose (" + f.get("glucose") + ")", "category", "Biometric", "impact", "High"));
    if (toInt(f, "condition_count") >= 3) factors.add(Map.of("factor", toInt(f, "condition_count") + " conditions", "category", "Medical", "impact", "High"));
    if (toDouble(f, "weight_trend") > 2) factors.add(Map.of("factor", "Weight gain (+" + f.get("weight_trend") + " kg)", "category", "Trend", "impact", "Medium"));
    if (toDouble(f, "glucose_trend") > 10) factors.add(Map.of("factor", "Glucose up (+" + f.get("glucose_trend") + ")", "category", "Trend", "impact", "High"));
    if (toDouble(f, "avg_symptom_severity") > 5) factors.add(Map.of("factor", "High symptom severity (" + f.get("avg_symptom_severity") + "/10)", "category", "Symptoms", "impact", "Medium"));
    if (toLong(f, "missed_consultations") >= 2) factors.add(Map.of("factor", f.get("missed_consultations") + " missed consultations", "category", "Engagement", "impact", "Medium"));
    return factors;
  }

  private List<String> identifyProtectiveFactors(Map<String, Object> f) {
    List<String> good = new ArrayList<>();
    if (toDouble(f, "health_score") > 70) good.add("Good health score (" + f.get("health_score") + "/100)");
    if (toDouble(f, "engagement_score") > 70) good.add("High engagement (" + f.get("engagement_score") + "/100)");
    if (toDouble(f, "goals_achieved_pct") > 60) good.add("Strong goal achievement (" + f.get("goals_achieved_pct") + "%)");
    if (toDouble(f, "bmi") >= 18.5 && toDouble(f, "bmi") <= 25) good.add("Healthy BMI");
    if (toDouble(f, "systolic") <= 120) good.add("Normal blood pressure");
    if (toDouble(f, "glucose") <= 100) good.add("Healthy glucose");
    if (good.isEmpty()) good.add("Actively using the platform");
    return good;
  }

  private Map<String, Object> buildBreakdown(Map<String, Object> f) {
    Map<String, Object> bd = new LinkedHashMap<>();
    bd.put("healthScore", f.get("health_score"));
    bd.put("engagementScore", f.get("engagement_score"));
    bd.put("deteriorationSignal", f.get("deterioration_signal"));
    bd.put("conditionCount", f.get("condition_count"));
    bd.put("symptomBurden", f.get("avg_symptom_severity"));
    return bd;
  }

  private double[] buildFeatureArray(Map<String, Object> features) {
    double[] arr = new double[featureColumns.size()];
    for (int i = 0; i < featureColumns.size(); i++) {
      Object v = features.get(featureColumns.get(i));
      arr[i] = v instanceof Number ? ((Number) v).doubleValue() : 0;
    }
    return arr;
  }

  private int traverse(JsonNode node, double[] features) {
    if (node.has("l") && node.get("l").isBoolean() && node.get("l").asBoolean()) return node.get("c").asInt();
    int idx = featureColumns.indexOf(node.get("f").asText());
    if (idx < 0 || idx >= features.length) return 0;
    return features[idx] <= node.get("t").asDouble() ? traverse(node.get("L"), features) : traverse(node.get("R"), features);
  }

  private double round(double v) { return Math.round(v * 10.0) / 10.0; }
  private int toInt(Map<String, Object> m, String k) { Object v = m.get(k); return v instanceof Number ? ((Number) v).intValue() : 0; }
  private double toDouble(Map<String, Object> m, String k) { Object v = m.get(k); return v instanceof Number ? ((Number) v).doubleValue() : 0; }
  private long toLong(Map<String, Object> m, String k) { Object v = m.get(k); return v instanceof Number ? ((Number) v).longValue() : 0; }
}
