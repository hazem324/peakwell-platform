package tn.esprit.peakwell.controller;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.peakwell.services.IUserActivityService;

import java.util.Map;

@RestController
@RequestMapping("/activity")
@RequiredArgsConstructor
public class UserActivityController {

    private final IUserActivityService activityService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        try {
            return ResponseEntity.ok(activityService.getDashboard());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching dashboard"));
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        try {
            return ResponseEntity.ok(activityService.getSummary());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching summary"));
        }
    }

    @GetMapping("/by-type")
    public ResponseEntity<?> getByType() {
        try {
            return ResponseEntity.ok(activityService.getByType());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching activity by type"));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentActivity(
            @RequestParam(defaultValue = "20") int limit) {
        try {
            if (limit < 1 || limit > 100) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Limit must be between 1 and 100"));
            }
            return ResponseEntity.ok(activityService.getRecentActivity(limit));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching recent activity"));
        }
    }

    @GetMapping("/per-day")
    public ResponseEntity<?> getActivityPerDay() {
        try {
            return ResponseEntity.ok(activityService.getActivityPerDay());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching activity per day"));
        }
    }

    @GetMapping("/failed-per-day")
    public ResponseEntity<?> getFailedPerDay() {
        try {
            return ResponseEntity.ok(activityService.getFailedPerDay());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching failed attempts per day"));
        }
    }

    @GetMapping("/top-ips")
    public ResponseEntity<?> getTopIps(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            if (limit < 1 || limit > 50) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Limit must be between 1 and 50"));
            }
            return ResponseEntity.ok(activityService.getTopIps(limit));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching top IPs"));
        }
    }

    @GetMapping("/top-agents")
    public ResponseEntity<?> getTopUserAgents(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            if (limit < 1 || limit > 50) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Limit must be between 1 and 50"));
            }
            return ResponseEntity.ok(activityService.getTopUserAgents(limit));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching top user agents"));
        }
    }

    @GetMapping("/by-hour")
    public ResponseEntity<?> getByHour() {
        try {
            return ResponseEntity.ok(activityService.getByHour());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching activity by hour"));
        }
    }

    @GetMapping("/action-status")
    public ResponseEntity<?> getActionStatusBreakdown() {
        try {
            return ResponseEntity.ok(activityService.getActionStatusBreakdown());
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching action status breakdown"));
        }
    }

    @GetMapping("/most-active")
    public ResponseEntity<?> getMostActiveUsers(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            if (limit < 1 || limit > 50) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Limit must be between 1 and 50"));
            }
            return ResponseEntity.ok(activityService.getMostActiveUsers(limit));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching most active users"));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserActivity(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            if (limit < 1 || limit > 200) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Limit must be between 1 and 200"));
            }
            return ResponseEntity.ok(activityService.getUserActivity(userId, limit));
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                    .body(Map.of("message", ex.getReason()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching user activity"));
        }
    }


}
