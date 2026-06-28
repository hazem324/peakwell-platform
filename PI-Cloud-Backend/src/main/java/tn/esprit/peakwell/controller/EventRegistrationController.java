package tn.esprit.peakwell.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.peakwell.dto.AdminEventRegistrationDto;
import tn.esprit.peakwell.entities.EventRegistration;
import tn.esprit.peakwell.entities.SportEvent;
import tn.esprit.peakwell.entities.User;
import tn.esprit.peakwell.enums.RegistrationStatus;
import tn.esprit.peakwell.services.EventRegistrationService;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin("*")
public class EventRegistrationController {

    private final EventRegistrationService registrationService;

    public EventRegistrationController(EventRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public ResponseEntity<List<EventRegistration>> getAllRegistrations() {
        return ResponseEntity.ok(registrationService.getAllRegistrations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventRegistration> getRegistrationById(@PathVariable Long id) {
        return ResponseEntity.ok(registrationService.getRegistrationById(id));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EventRegistration>> getByStudentId(@PathVariable Long studentId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByStudentId(studentId));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<EventRegistration>> getByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/admin")
    public ResponseEntity<List<AdminEventRegistrationDto>> getAdminRegistrationsByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(registrationService.getAdminRegistrationsByEventId(eventId));
    }

    @PostMapping("/event/{eventId}")
    public ResponseEntity<EventRegistration> createRegistration(@PathVariable Long eventId) {
        return new ResponseEntity<>(registrationService.createRegistration(eventId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<EventRegistration> updateRegistrationStatus(@PathVariable Long id,
                                                                      @RequestParam RegistrationStatus status) {
        return ResponseEntity.ok(registrationService.updateRegistrationStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRegistration(@PathVariable Long id) {
        registrationService.deleteRegistration(id);
        return ResponseEntity.ok("Registration deleted successfully.");
    }



}