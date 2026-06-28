package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;
import tn.esprit.peakwell.dto.AdminEventRegistrationDto;
import tn.esprit.peakwell.entities.EventRegistration;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.entities.Student;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.enums.EventStatus;
import tn.esprit.peakwell.enums.RegistrationStatus;
import tn.esprit.peakwell.repositories.EventRegistrationRepository;
import tn.esprit.peakwell.repositories.SportEventRepository;
import tn.esprit.peakwell.repositories.StudentRepository;
import tn.esprit.peakwell.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventRegistrationService {

    private final EventRegistrationRepository registrationRepository;
    private final SportEventRepository sportEventRepository;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final EmailService emailService;
    private final QRCodeService qrCodeService;
    @Value("${app.public-url}")
    private String publicUrl;

    public EventRegistrationService(EventRegistrationRepository registrationRepository,
                                    SportEventRepository sportEventRepository,
                                    AuthService authService,
                                    UserRepository userRepository,
                                    StudentRepository studentRepository,
                                    EmailService emailService,
                                    QRCodeService qrCodeService)  {
        this.registrationRepository = registrationRepository;
        this.sportEventRepository = sportEventRepository;
        this.authService = authService;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.emailService = emailService;
        this.qrCodeService = qrCodeService;
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

    private void sendPromotionEmail(EventRegistration registration) {
        try {
            if (registration.getStudent() == null || registration.getStudent().getUser() == null) {
                return;
            }

            User user = registration.getStudent().getUser();
            SportEvent event = registration.getEvent();

            String to = user.getEmail();
            String studentName = user.getFirstName() != null ? user.getFirstName() : "Student";
            String eventTitle = event.getTitle();
            String date = event.getEventDate() != null ? event.getEventDate().toString() : "scheduled date";

            emailService.sendEventPromotionEmail(to, studentName, eventTitle, date);

        } catch (Exception e) {
            System.out.println("Failed to send promotion email: " + e.getMessage());
        }
    }

    public List<EventRegistration> getAllRegistrations() {
        syncExpiredEventsAndRegistrations();
        return registrationRepository.findAll();
    }

    public EventRegistration getRegistrationById(Long id) {
        syncExpiredEventsAndRegistrations();
        return registrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registration not found with id: " + id));
    }

    public List<EventRegistration> getRegistrationsByStudentId(Long studentId) {
        syncExpiredEventsAndRegistrations();
        return registrationRepository.findByStudent_Id(studentId);
    }

    public List<EventRegistration> getRegistrationsByEventId(Long eventId) {
        syncExpiredEventsAndRegistrations();
        return registrationRepository.findByEventId(eventId);
    }

    public List<AdminEventRegistrationDto> getAdminRegistrationsByEventId(Long eventId) {
        syncExpiredEventsAndRegistrations();

        List<EventRegistration> registrations = registrationRepository.findByEventId(eventId);

        return registrations.stream().map(reg -> {
            Long studentId = null;
            String firstName = "";
            String lastName = "";
            String fullName = "Student";
            String email = "";
            String imageUrl = null;

            if (reg.getStudent() != null) {
                studentId = reg.getStudent().getId();

                if (reg.getStudent().getUser() != null) {
                    User user = reg.getStudent().getUser();

                    firstName = user.getFirstName() != null ? user.getFirstName() : "";
                    lastName = user.getLastName() != null ? user.getLastName() : "";
                    email = user.getEmail() != null ? user.getEmail() : "";
                    imageUrl = user.getImgUrl();

                    String tmpFullName = (firstName + " " + lastName).trim();
                    if (!tmpFullName.isEmpty()) {
                        fullName = tmpFullName;
                    }
                }
            }

            return new AdminEventRegistrationDto(
                    reg.getId(),
                    reg.getRegistrationDate(),
                    reg.getStatus().name(),
                    studentId,
                    firstName,
                    lastName,
                    fullName,
                    email,
                    imageUrl
            );
        }).collect(Collectors.toList());
    }

    public EventRegistration createRegistration(Long eventId) {
        syncExpiredEventsAndRegistrations();

        Student student = getCurrentStudent();

        SportEvent event = sportEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        if (event.getEventDate() != null && event.getEventDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This event is already finished. Registration is not allowed.");
        }

        event.updateStatusBasedOnCapacity();

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.FINISHED) {
            throw new IllegalArgumentException("This event is not available for registration.");
        }

        registrationRepository.findByStudent_IdAndEventId(student.getId(), eventId)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("This student is already registered for this event.");
                });

        EventRegistration registration = new EventRegistration();
        registration.setStudent(student);
        registration.setEvent(event);
        registration.setRegistrationDate(LocalDateTime.now());

        if (event.getCurrentParticipants() < event.getMaxParticipants()) {
            registration.setStatus(RegistrationStatus.CONFIRMED);
            event.setCurrentParticipants(event.getCurrentParticipants() + 1);
        } else {
            registration.setStatus(RegistrationStatus.WAITING);
        }

        event.updateStatusBasedOnCapacity();
        sportEventRepository.save(event);

        // save regisration
        EventRegistration saved = registrationRepository.save(registration);

        // mta3 code QR w email


        return saved;
    }
    public EventRegistration updateRegistrationStatus(Long id, RegistrationStatus newStatus) {
        syncExpiredEventsAndRegistrations();

        EventRegistration registration = getRegistrationById(id);
        SportEvent event = registration.getEvent();
        RegistrationStatus oldStatus = registration.getStatus();

        if (event.getStatus() == EventStatus.FINISHED) {
            throw new IllegalArgumentException("Cannot update registration of a finished event.");
        }

        if (oldStatus == newStatus) {
            return registration;
        }

        boolean oldCounted = (oldStatus == RegistrationStatus.CONFIRMED || oldStatus == RegistrationStatus.ATTENDED);
        boolean newCounted = (newStatus == RegistrationStatus.CONFIRMED || newStatus == RegistrationStatus.ATTENDED);

        if (oldCounted && !newCounted) {
            if (event.getCurrentParticipants() > 0) {
                event.setCurrentParticipants(event.getCurrentParticipants() - 1);
            }
        }

        if (!oldCounted && newCounted) {
            if (event.getCurrentParticipants() >= event.getMaxParticipants()) {
                throw new IllegalArgumentException("Cannot confirm registration: event is already full.");
            }
            event.setCurrentParticipants(event.getCurrentParticipants() + 1);
        }

        registration.setStatus(newStatus);
        registrationRepository.save(registration);

        if (oldCounted && !newCounted) {
            registrationRepository.findFirstByEventIdAndStatusOrderByRegistrationDateAsc(
                    event.getId(),
                    RegistrationStatus.WAITING
            ).ifPresent(waitingRegistration -> {
                waitingRegistration.setStatus(RegistrationStatus.CONFIRMED);
                registrationRepository.save(waitingRegistration);
                event.setCurrentParticipants(event.getCurrentParticipants() + 1);

                sendPromotionEmail(waitingRegistration);
            });
        }

        event.updateStatusBasedOnCapacity();
        sportEventRepository.save(event);

        return registration;
    }

    public void deleteRegistration(Long id) {
        syncExpiredEventsAndRegistrations();

        EventRegistration registration = getRegistrationById(id);
        SportEvent event = registration.getEvent();
        RegistrationStatus status = registration.getStatus();

        if (status == RegistrationStatus.ATTENDED) {
            throw new IllegalArgumentException("Attended registrations cannot be cancelled.");
        }

        if (event.getStatus() == EventStatus.FINISHED) {
            throw new IllegalArgumentException("Finished event registrations cannot be cancelled.");
        }

        boolean counted = (status == RegistrationStatus.CONFIRMED);

        if (counted && event.getCurrentParticipants() > 0) {
            event.setCurrentParticipants(event.getCurrentParticipants() - 1);
        }

        registrationRepository.delete(registration);
//--wl
        if (counted) {
            registrationRepository.findFirstByEventIdAndStatusOrderByRegistrationDateAsc(
                    event.getId(),
                    RegistrationStatus.WAITING
            ).ifPresent(waitingRegistration -> {
                waitingRegistration.setStatus(RegistrationStatus.CONFIRMED);
                registrationRepository.save(waitingRegistration);
                event.setCurrentParticipants(event.getCurrentParticipants() + 1);

                sendPromotionEmail(waitingRegistration);
            });
        }

        event.updateStatusBasedOnCapacity();
        sportEventRepository.save(event);
    }



}