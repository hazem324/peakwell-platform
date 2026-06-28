package tn.esprit.peakwell.controller;

import tn.esprit.peakwell.dto.TimelineResponse;
import tn.esprit.peakwell.services.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TimelineController {

  private final TimelineService timelineService;

  @GetMapping
  public ResponseEntity<TimelineResponse> getTimeline(
    @RequestParam(required = false, defaultValue = "all") String filter,
    @RequestParam(required = false) String startDate,
    @RequestParam(required = false) String endDate) {
    return ResponseEntity.ok(timelineService.getTimeline(filter, startDate, endDate));
  }
}
