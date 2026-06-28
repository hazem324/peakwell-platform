package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineResponse {

  private List<TimelineEvent> events;
  private int totalEvents;
  private Map<String, Integer> eventCounts;  // {biometric: 5, symptom: 12, goal: 3, alert: 8}
  private String dateRange;                   // "Mar 1 — Mar 18, 2026"
}
