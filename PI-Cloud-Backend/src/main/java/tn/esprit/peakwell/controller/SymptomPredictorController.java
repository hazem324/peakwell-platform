package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.services.SymptomPredictorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/predict")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class SymptomPredictorController {

  private final SymptomPredictorService predictorService;

  @PostMapping("/severity")
  public ResponseEntity<Map<String, Object>> predictSeverity(@RequestBody Map<String, Object> req) {
    int    stress       = ((Number) req.getOrDefault("stressLevel",       3)).intValue();
    int    mood         = ((Number) req.getOrDefault("mood",              3)).intValue();
    int    energy       = ((Number) req.getOrDefault("energyLevel",       3)).intValue();
    double sleep        = ((Number) req.getOrDefault("sleepHours",        7.0)).doubleValue();
    int    water        = ((Number) req.getOrDefault("waterIntakeMl",     2000)).intValue();
    String time         = (String)  req.getOrDefault("timeOfDay",         "morning");
    List<String> symptoms = (List<String>) req.getOrDefault("symptoms",  List.of());
    List<String> triggers = (List<String>) req.getOrDefault("triggers",  List.of());
    int    age          = ((Number) req.getOrDefault("age",               30)).intValue();
    double bmi          = ((Number) req.getOrDefault("bmi",               24.0)).doubleValue();
    boolean chronic     = Boolean.TRUE.equals(req.getOrDefault("hasChronicCondition", false));
    double exerciseHrs  = ((Number) req.getOrDefault("exerciseHoursWeekly", 3.0)).doubleValue();
    int    caffeineCups = ((Number) req.getOrDefault("caffeineCupsDaily", 2)).intValue();

    // Biometric fields — null when user hasn't recorded them
    Double systolicBp     = req.get("systolicBp")     != null ? ((Number) req.get("systolicBp")).doubleValue()     : null;
    Double diastolicBp    = req.get("diastolicBp")    != null ? ((Number) req.get("diastolicBp")).doubleValue()    : null;
    Double bodyFatPercent = req.get("bodyFatPercent") != null ? ((Number) req.get("bodyFatPercent")).doubleValue() : null;
    Double muscleMassKg   = req.get("muscleMassKg")   != null ? ((Number) req.get("muscleMassKg")).doubleValue()   : null;
    Double glucoseMgDl    = req.get("glucoseMgDl")    != null ? ((Number) req.get("glucoseMgDl")).doubleValue()    : null;

    Map<String, Object> prediction = predictorService.predictMultiple(
            stress, mood, energy, sleep, water, time, symptoms, triggers,
            age, bmi, chronic, exerciseHrs, caffeineCups,
            systolicBp, diastolicBp, bodyFatPercent, muscleMassKg, glucoseMgDl);

    return ResponseEntity.ok(prediction);
  }

  @PostMapping("/diseases")
  @SuppressWarnings("unchecked")
  public ResponseEntity<Map<String, Object>> predictDiseases(@RequestBody Map<String, Object> req) {
    try {
      RestTemplate rt = new RestTemplate();
      Map<String, Object> response = rt.postForObject("http://localhost:8000/predict/diseases", req, Map.class);
      return ResponseEntity.ok(response != null ? response : Map.of("error", "Empty response from AI service"));
    } catch (Exception e) {
      return ResponseEntity.status(502).body(Map.of("error", "Disease AI service unavailable: " + e.getMessage()));
    }
  }

  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> getModelStatus() {
    return ResponseEntity.ok(Map.of(
            "modelLoaded",    predictorService.isModelLoaded(),
            "symptomTypes",   predictorService.getSymptomTypes(),
            "triggerNames",   predictorService.getTriggerNames(),
            "severityLabels", predictorService.getSeverityLabels()
    ));
  }
}