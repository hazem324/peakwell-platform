package tn.esprit.peakwell.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class SymptomPredictorService {

  private final RestTemplate rest;

  @Value("${peakwell.ai.url:http://localhost:8000}")
  private String aiBaseUrl;

  private static final List<String> SYMPTOM_TYPES = List.of(
          "Headache", "Fatigue", "Nausea", "Dizziness", "Insomnia",
          "Bloating", "Joint Pain", "Muscle Pain", "Anxiety", "Brain Fog",
          "Chest Tightness", "Shortness of Breath", "Back Pain", "Stomach Pain",
          "Heartburn", "Cramps", "Numbness", "Skin Rash");

  private static final List<String> TRIGGER_NAMES = List.of(
          "caffeine", "poor_sleep", "stress", "skipped_meal", "exercise",
          "dehydration", "screen_time", "alcohol", "weather", "medication");

  private static final Map<Integer, String> SEVERITY_LABELS = Map.of(
          1, "Mild", 2, "Light", 3, "Moderate", 4, "Severe", 5, "Very Severe");

  public SymptomPredictorService(RestTemplateBuilder builder) {
    this.rest = builder
            .connectTimeout(Duration.ofSeconds(5))
            .readTimeout(Duration.ofSeconds(30))
            .build();
  }

  public boolean isModelLoaded() {
    try {
      Map<?, ?> status = rest.getForObject(aiBaseUrl + "/predict/status", Map.class);
      return status != null && Boolean.TRUE.equals(status.get("modelLoaded"));
    } catch (Exception e) {
      log.warn("FastAPI not reachable: {}", e.getMessage());
      return false;
    }
  }

  // ── Main proxy call ─────────────────────────────────────────────

  public Map<String, Object> predictMultiple(
          int stress, int mood, int energy, double sleep, int water,
          String timeOfDay, List<String> symptoms, List<String> triggers,
          int age, double bmi, boolean chronic, double exerciseHrs, int caffeineCups,
          Double systolicBp, Double diastolicBp,
          Double bodyFatPercent, Double muscleMassKg, Double glucoseMgDl) {

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("stressLevel",        stress);
    body.put("mood",               mood);
    body.put("energyLevel",        energy);
    body.put("sleepHours",         sleep);
    body.put("waterIntakeMl",      water);
    body.put("timeOfDay",          timeOfDay);
    body.put("symptoms",           symptoms);
    body.put("triggers",           triggers);
    body.put("age",                age);
    body.put("bmi",                bmi);
    body.put("hasChronicCondition", chronic);
    body.put("exerciseHoursWeekly", exerciseHrs);
    body.put("caffeineCupsDaily",  caffeineCups);
    if (systolicBp     != null) body.put("systolicBp",     systolicBp);
    if (diastolicBp    != null) body.put("diastolicBp",    diastolicBp);
    if (bodyFatPercent != null) body.put("bodyFatPercent", bodyFatPercent);
    if (muscleMassKg   != null) body.put("muscleMassKg",   muscleMassKg);
    if (glucoseMgDl    != null) body.put("glucoseMgDl",    glucoseMgDl);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

    try {
      ResponseEntity<Map> response = rest.postForEntity(
              aiBaseUrl + "/predict/severity", entity, Map.class);
      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return (Map<String, Object>) response.getBody();
      }
    } catch (ResourceAccessException e) {
      log.error("FastAPI unreachable — is it running on {}? Error: {}", aiBaseUrl, e.getMessage());
    } catch (Exception e) {
      log.error("Prediction proxy failed: {}", e.getMessage());
    }

    Map<String, Object> err = new LinkedHashMap<>();
    err.put("error", "AI service unavailable. Start the FastAPI server: uvicorn api:app --port 8000");
    return err;
  }

  // ── Kept for status endpoint ─────────────────────────────────────

  public List<String> getSymptomTypes()           { return SYMPTOM_TYPES; }
  public List<String> getTriggerNames()           { return TRIGGER_NAMES; }
  public Map<Integer, String> getSeverityLabels() { return SEVERITY_LABELS; }
}