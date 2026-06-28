package tn.esprit.peakwell.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.dto.AdminEventReviewDto;
import tn.esprit.peakwell.entities.EventReview;
import tn.esprit.peakwell.services.EventReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin("*")
public class EventReviewController {

    private final EventReviewService reviewService;

    public EventReviewController(EventReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<List<EventReview>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventReview> getReviewById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReviewById(id));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EventReview>> getByStudentId(@PathVariable Long studentId) {
        return ResponseEntity.ok(reviewService.getReviewsByStudentId(studentId));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<EventReview>> getByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(reviewService.getReviewsByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/admin")
    public ResponseEntity<List<AdminEventReviewDto>> getAdminReviewsByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(reviewService.getAdminReviewsByEventId(eventId));
    }

    @PostMapping("/event/{eventId}")
    public ResponseEntity<EventReview> createReview(@PathVariable Long eventId,
                                                    @Valid @RequestBody EventReview review) {
        return new ResponseEntity<>(reviewService.createReview(eventId, review), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventReview> updateReview(@PathVariable Long id, @Valid @RequestBody EventReview review) {
        return ResponseEntity.ok(reviewService.updateReview(id, review));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.ok("Review deleted successfully.");
    }
}