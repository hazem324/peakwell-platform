package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.SymptomCorrelationResponse;
import tn.esprit.peakwell.dto.SymptomEntryRequest;
import tn.esprit.peakwell.dto.SymptomEntryResponse;
import tn.esprit.peakwell.services.SymptomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/symptoms")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class SymptomController {

  private final SymptomService symptomService;

  // ── CRUD ────────────────────────────────────────

  @GetMapping
  public ResponseEntity<List<SymptomEntryResponse>> getAll() {
    return ResponseEntity.ok(symptomService.getAll());
  }

  @GetMapping("/date/{date}")
  public ResponseEntity<List<SymptomEntryResponse>> getByDate(@PathVariable String date) {
    return ResponseEntity.ok(symptomService.getByDate(date));
  }

  @GetMapping("/range")
  public ResponseEntity<List<SymptomEntryResponse>> getByRange(
    @RequestParam String start, @RequestParam String end) {
    return ResponseEntity.ok(symptomService.getByRange(start, end));
  }

  @GetMapping("/by-symptom/{symptom}")
  public ResponseEntity<List<SymptomEntryResponse>> getBySymptom(@PathVariable String symptom) {
    return ResponseEntity.ok(symptomService.getBySymptom(symptom));
  }

  @GetMapping("/types")
  public ResponseEntity<List<String>> getDistinctSymptoms() {
    return ResponseEntity.ok(symptomService.getDistinctSymptoms());
  }

  @PostMapping
  public ResponseEntity<SymptomEntryResponse> addEntry(@RequestBody SymptomEntryRequest request) {
    return ResponseEntity.ok(symptomService.addEntry(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<SymptomEntryResponse> updateEntry(
    @PathVariable Long id, @RequestBody SymptomEntryRequest request) {
    return ResponseEntity.ok(symptomService.updateEntry(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
    symptomService.deleteEntry(id);
    return ResponseEntity.noContent().build();
  }

  // ── AI CORRELATION ANALYSIS ─────────────────────

  @GetMapping("/correlations")
  public ResponseEntity<SymptomCorrelationResponse> analyzeCorrelations() {
    return ResponseEntity.ok(symptomService.analyzeCorrelations());
  }
}
