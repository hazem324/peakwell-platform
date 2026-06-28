package tn.esprit.peakwell.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.services.GoalStatisticsService;

import java.util.Map;

@RestController
@RequestMapping("/api/goals/statistics")
@RequiredArgsConstructor
@CrossOrigin("*")
public class GoalStatisticsController {

  private final GoalStatisticsService statisticsService;

  @GetMapping
  public Map<String, Object> getStatistics() {
    return statisticsService.getStatistics();
  }
}
