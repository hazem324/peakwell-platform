package tn.esprit.peakwell.services;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.dto.MedicalProfileRequest;
import tn.esprit.peakwell.dto.MedicalProfileResponse;
import tn.esprit.peakwell.entities.MedicalProfile;
import tn.esprit.peakwell.repositories.DietitianRepository;
import tn.esprit.peakwell.repositories.MedicalProfileRepository;
import tn.esprit.peakwell.repositories.StudentRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalProfileService {

    private final MedicalProfileRepository repository;
    private final StudentRepository studentRepository;
    private final DietitianRepository dietitianRepository;

    /** Get the profile belonging to the given student/user ID. */
    public MedicalProfileResponse getProfile(Long userId) {
        return repository.findByStudentId(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    /** Save (create or update) the profile for the given student/user ID. */
    public MedicalProfileResponse saveProfile(MedicalProfileRequest request, Long userId) {
        MedicalProfile profile = repository.findByStudentId(userId)
                .orElse(MedicalProfile.builder().build());

        // Always link student and pull height + name directly from the Student/User record
        var student = studentRepository.findById(userId).orElse(null);
        if (student != null) {
            if (profile.getStudent() == null) {
                profile.setStudent(student);
            }
            // Auto-fill from student record — frontend values are ignored for these fields
            var user = student.getUser();
            if (user != null) {
                profile.setFirstName(user.getFirstName());
                profile.setLastName(user.getLastName());
            }
            if (student.getHeight() != null) {
                profile.setHeight(student.getHeight().doubleValue());
            }
        }

        // DateOfBirth: use request value if provided, otherwise keep existing
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }

        profile.setGender(request.getGender());
        profile.setBloodType(request.getBloodType());
        profile.setEmergencyContact(request.getEmergencyContact());
        profile.setAllergies(request.getAllergies() != null ? request.getAllergies() : new ArrayList<>());
        profile.setConditions(request.getConditions() != null ? request.getConditions() : new ArrayList<>());
        profile.setMedications(request.getMedications() != null ? request.getMedications() : new ArrayList<>());

        if (request.getDietitianId() != null) {
            dietitianRepository.findById(request.getDietitianId()).ifPresent(profile::setAssignedDietitian);
        }

        // Check completeness from the profile's actual values (name/height come from student entity)
        // dateOfBirth is optional — neither User nor Student entity stores it
        boolean complete = profile.getFirstName() != null && !profile.getFirstName().isBlank()
                && profile.getLastName()  != null && !profile.getLastName().isBlank()
                && profile.getGender()    != null && !profile.getGender().isBlank()
                && profile.getBloodType() != null && !profile.getBloodType().isBlank()
                && profile.getHeight()    != null && profile.getHeight() > 0;

        profile.setComplete(complete);
        return toResponse(repository.save(profile));
    }

    public List<MedicalProfileResponse> getAllProfiles() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public MedicalProfileResponse getProfileByStudent(Long studentId) {
        return repository.findByStudentId(studentId).map(this::toResponse).orElse(null);
    }

    public List<MedicalProfileResponse> getProfilesByDietitian(Long dietitianId) {
        return repository.findByAssignedDietitianId(dietitianId)
                .stream().map(this::toResponse).toList();
    }

    public MedicalProfileResponse assignDietitian(Long profileId, Long dietitianId) {
        MedicalProfile profile = repository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        dietitianRepository.findById(dietitianId).ifPresent(profile::setAssignedDietitian);
        return toResponse(repository.save(profile));
    }

    private MedicalProfileResponse toResponse(MedicalProfile p) {
        MedicalProfileResponse res = new MedicalProfileResponse();
        res.setId(p.getId());
        res.setFirstName(p.getFirstName());
        res.setLastName(p.getLastName());
        res.setDateOfBirth(p.getDateOfBirth());
        res.setGender(p.getGender());
        res.setBloodType(p.getBloodType());
        res.setHeight(p.getHeight());
        res.setEmergencyContact(p.getEmergencyContact());
        res.setAllergies(p.getAllergies());
        res.setConditions(p.getConditions());
        res.setMedications(p.getMedications());
        res.setComplete(p.getComplete());
        if (p.getStudent() != null) {
            res.setStudentId(p.getStudent().getId());
            res.setStudentName(p.getStudent().getUser() != null
                    ? p.getStudent().getUser().getFirstName() + " " + p.getStudent().getUser().getLastName()
                    : null);
        }
        if (p.getAssignedDietitian() != null) {
            res.setDietitianId(p.getAssignedDietitian().getId());
            res.setDietitianSpecialization(p.getAssignedDietitian().getSpecialization());
            res.setDietitianName(p.getAssignedDietitian().getUser() != null
                    ? p.getAssignedDietitian().getUser().getFirstName() + " " + p.getAssignedDietitian().getUser().getLastName()
                    : null);
        }
        return res;
    }
}