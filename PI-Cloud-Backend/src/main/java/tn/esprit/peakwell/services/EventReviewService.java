package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;
import tn.esprit.peakwell.dto.AdminEventReviewDto;
import tn.esprit.peakwell.entities.EventRegistration;
import tn.esprit.peakwell.entities.EventReview;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.entities.Student;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.enums.EventStatus;
import tn.esprit.peakwell.enums.RegistrationStatus;
import tn.esprit.peakwell.repositories.EventRegistrationRepository;
import tn.esprit.peakwell.repositories.EventReviewRepository;
import tn.esprit.peakwell.repositories.SportEventRepository;
import tn.esprit.peakwell.repositories.StudentRepository;
import tn.esprit.peakwell.repositories.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventReviewService {

    private final EventReviewRepository reviewRepository;
    private final SportEventRepository sportEventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    public EventReviewService(EventReviewRepository reviewRepository,
                              SportEventRepository sportEventRepository,
                              EventRegistrationRepository registrationRepository,
                              AuthService authService,
                              UserRepository userRepository,
                              StudentRepository studentRepository) {
        this.reviewRepository = reviewRepository;
        this.sportEventRepository = sportEventRepository;
        this.registrationRepository = registrationRepository;
        this.authService = authService;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    private void syncExpiredEventsAndRegistrations() {
        sportEventRepository.updateExpiredEvents();
        registrationRepository.updateConfirmedRegistrationsToAttended();
    }

    private Student getCurrentStudent() {
        String keycloakId = authService.getCurrentUserId();

        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return studentRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public List<EventReview> getAllReviews() {
        syncExpiredEventsAndRegistrations();
        return reviewRepository.findAll();
    }

    public EventReview getReviewById(Long id) {
        syncExpiredEventsAndRegistrations();

        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
    }

    public List<EventReview> getReviewsByStudentId(Long studentId) {
        syncExpiredEventsAndRegistrations();
        return reviewRepository.findByStudent_Id(studentId);
    }

    public List<EventReview> getReviewsByEventId(Long eventId) {
        syncExpiredEventsAndRegistrations();
        return reviewRepository.findByEventId(eventId);
    }

    public List<AdminEventReviewDto> getAdminReviewsByEventId(Long eventId) {
        syncExpiredEventsAndRegistrations();

        List<EventReview> reviews = reviewRepository.findByEventId(eventId);

        return reviews.stream().map(review -> {
            Long studentId = null;
            String studentName = "Student";
            String studentImageUrl = null;

            if (review.getStudent() != null) {
                studentId = review.getStudent().getId();

                if (review.getStudent().getUser() != null) {
                    String firstName = review.getStudent().getUser().getFirstName() != null
                            ? review.getStudent().getUser().getFirstName()
                            : "";
                    String lastName = review.getStudent().getUser().getLastName() != null
                            ? review.getStudent().getUser().getLastName()
                            : "";

                    String fullName = (firstName + " " + lastName).trim();
                    if (!fullName.isEmpty()) {
                        studentName = fullName;
                    }

                    studentImageUrl = review.getStudent().getUser().getImgUrl();
                }
            }

            return new AdminEventReviewDto(
                    review.getId(),
                    review.getRating(),
                    review.getComment(),
                    review.getReviewDate(),
                    studentId,
                    studentName,
                    studentImageUrl
            );
        }).collect(Collectors.toList());
    }

    public EventReview createReview(Long eventId, EventReview reviewPayload) {
        syncExpiredEventsAndRegistrations();

        Student student = getCurrentStudent();

        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        if (event.getStatus() != EventStatus.FINISHED) {
            throw new IllegalArgumentException("Review is allowed only after event completion.");
        }

        EventRegistration registration = registrationRepository
                .findByStudent_IdAndEventId(student.getId(), eventId)
                .orElseThrow(() -> new IllegalArgumentException("Student did not register for this event."));

        if (registration.getStatus() != RegistrationStatus.ATTENDED) {
            throw new IllegalArgumentException("Only attended students can review this event.");
        }

        reviewRepository.findByStudent_IdAndEventId(student.getId(), eventId)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("This student already reviewed this event.");
                });

        EventReview review = new EventReview();
        review.setRating(reviewPayload.getRating());
        review.setComment(reviewPayload.getComment());
        review.setReviewDate(LocalDateTime.now());
        review.setStudent(student);
        review.setEvent(event);

        return reviewRepository.save(review);
    }

    public EventReview updateReview(Long id, EventReview updatedReview) {
        syncExpiredEventsAndRegistrations();

        EventReview existingReview = getReviewById(id);

        existingReview.setRating(updatedReview.getRating());
        existingReview.setComment(updatedReview.getComment());

        return reviewRepository.save(existingReview);
    }

    public void deleteReview(Long id) {
        EventReview review = getReviewById(id);
        reviewRepository.delete(review);
    }
}