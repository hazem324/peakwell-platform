package tn.esprit.peakwell.services;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.peakwell.dto.BiometricRequest;
import tn.esprit.peakwell.dto.BiometricResponse;
import tn.esprit.peakwell.dto.HealthAlertDto;
import tn.esprit.peakwell.entities.BiometricEntry;
import tn.esprit.peakwell.entities.MedicalProfile;
import tn.esprit.peakwell.repositories.BiometricEntryRepository;
import tn.esprit.peakwell.repositories.MedicalProfileRepository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BiometricService {

    private final BiometricEntryRepository repository;
    private final MedicalProfileRepository profileRepository;
    private final NotificationService notificationService;

    /** Returns the medical profile for the given user ID. */
    private MedicalProfile profileForUser(Long userId) {
        return profileRepository.findByStudentId(userId)
                .orElseThrow(() -> new RuntimeException("Medical profile not found. Please create your profile first."));
    }

    public List<BiometricResponse> getAll(Long userId) {
        MedicalProfile profile = profileForUser(userId);
        return repository.findAllByProfileIdOrderByRecordedAtAsc(profile.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private void validateAgainstPrevious(BiometricRequest request, MedicalProfile profile) {
        List<BiometricEntry> existing = repository.findAllByProfileIdOrderByRecordedAtAsc(profile.getId());
        if (existing.isEmpty()) return;

        BiometricEntry prev = existing.get(existing.size() - 1);
        long daysBetween = ChronoUnit.DAYS.between(prev.getRecordedAt().toLocalDate(), LocalDate.now());

        if (daysBetween > 90) return;
        long days = Math.max(1, daysBetween);

        double maxWeightChange = days * 0.8;
        double weightDiff = Math.abs(request.getWeight() - prev.getWeight());
        if (weightDiff > maxWeightChange) {
            throw new IllegalArgumentException(String.format(
                    "Weight change of %.1f kg over %d day(s) is not realistic. " +
                            "Your last recorded weight was %.1f kg. Maximum expected change: %.1f kg (800 g/day).",
                    weightDiff, days, prev.getWeight(), maxWeightChange));
        }

        if (request.getBodyFat() != null && prev.getBodyFat() != null) {
            double maxFatChange = days * 0.2;
            double fatDiff = Math.abs(request.getBodyFat() - prev.getBodyFat());
            if (fatDiff > maxFatChange) {
                throw new IllegalArgumentException(String.format(
                        "Body fat change of %.1f%% over %d day(s) is not realistic. " +
                                "Your last recorded value was %.1f%%. Maximum expected change: %.1f%%.",
                        fatDiff, days, prev.getBodyFat(), maxFatChange));
            }
        }

        if (request.getMuscleMass() != null && prev.getMuscleMass() != null) {
            double maxMuscleChange = days * 0.1;
            double muscleDiff = Math.abs(request.getMuscleMass() - prev.getMuscleMass());
            if (muscleDiff > maxMuscleChange) {
                throw new IllegalArgumentException(String.format(
                        "Muscle mass change of %.1f kg over %d day(s) is not realistic. " +
                                "Your last recorded value was %.1f kg. Maximum expected change: %.1f kg.",
                        muscleDiff, days, prev.getMuscleMass(), maxMuscleChange));
            }
        }

        if (request.getSystolic() != null && prev.getSystolic() != null) {
            int systolicDiff = Math.abs(request.getSystolic() - prev.getSystolic());
            int maxSystolic = (int)(days * 10);
            if (systolicDiff > maxSystolic) {
                throw new IllegalArgumentException(String.format(
                        "Systolic BP change of %d mmHg over %d day(s) is not realistic. " +
                                "Your last recorded value was %d mmHg. Maximum expected change: %d mmHg.",
                        systolicDiff, days, prev.getSystolic(), maxSystolic));
            }
        }

        if (request.getDiastolic() != null && prev.getDiastolic() != null) {
            int diastolicDiff = Math.abs(request.getDiastolic() - prev.getDiastolic());
            int maxDiastolic = (int)(days * 7);
            if (diastolicDiff > maxDiastolic) {
                throw new IllegalArgumentException(String.format(
                        "Diastolic BP change of %d mmHg over %d day(s) is not realistic. " +
                                "Your last recorded value was %d mmHg. Maximum expected change: %d mmHg.",
                        diastolicDiff, days, prev.getDiastolic(), maxDiastolic));
            }
        }

        if (request.getGlucose() != null && prev.getGlucose() != null) {
            double maxGlucose = days * 15.0;
            double glucoseDiff = Math.abs(request.getGlucose() - prev.getGlucose());
            if (glucoseDiff > maxGlucose) {
                throw new IllegalArgumentException(String.format(
                        "Glucose change of %.1f mg/dL over %d day(s) is not realistic. " +
                                "Your last recorded value was %.1f mg/dL. Maximum expected change: %.1f mg/dL.",
                        glucoseDiff, days, prev.getGlucose(), maxGlucose));
            }
        }
    }

    public BiometricResponse addEntry(BiometricRequest request, Long userId) {
        double bmi = Math.round((request.getWeight() / Math.pow(request.getHeight() / 100.0, 2)) * 10.0) / 10.0;
        MedicalProfile profile = profileForUser(userId);
        validateAgainstPrevious(request, profile);

        BiometricEntry entry = BiometricEntry.builder()
                .weight(request.getWeight())
                .height(request.getHeight())
                .bmi(bmi)
                .bodyFat(request.getBodyFat())
                .muscleMass(request.getMuscleMass())
                .systolic(request.getSystolic())
                .diastolic(request.getDiastolic())
                .glucose(request.getGlucose())
                .notes(request.getNotes())
                .profile(profile)
                .build();

        BiometricResponse saved = toResponse(repository.save(entry));
        notificationService.checkAndNotify(profile.getId());
        notificationService.checkAndNotifyDietitianForProfile(profile.getId());
        return saved;
    }

    public BiometricResponse getLatest(Long userId) {
        MedicalProfile profile = profileForUser(userId);
        return repository.findAllByProfileIdOrderByRecordedAtAsc(profile.getId())
                .stream()
                .reduce((first, second) -> second)
                .map(this::toResponse)
                .orElse(null);
    }

    public List<BiometricResponse> getByProfileId(Long profileId) {
        return repository.findAllByProfileIdOrderByRecordedAtAsc(profileId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public void deleteEntry(Long id) {
        repository.deleteById(id);
    }

    public List<HealthAlertDto> getAlerts(Long userId) {
        MedicalProfile profile = profileForUser(userId);
        List<BiometricEntry> entries = repository.findAllByProfileIdOrderByRecordedAtAsc(profile.getId());
        List<HealthAlertDto> alerts = new ArrayList<>();
        if (entries.isEmpty()) return alerts;

        BiometricEntry latest = entries.get(entries.size() - 1);
        BiometricEntry prev   = entries.size() >= 2 ? entries.get(entries.size() - 2) : null;

        if (prev != null) {
            double diff = Math.round((latest.getWeight() - prev.getWeight()) * 10.0) / 10.0;
            if (diff > 2)
                alerts.add(new HealthAlertDto("danger",  "Weight", "Rapid weight gain of +" + diff + "kg detected",   latest.getWeight() + " kg"));
            else if (diff < -3)
                alerts.add(new HealthAlertDto("warning", "Weight", "Rapid weight loss of "  + diff + "kg detected",   latest.getWeight() + " kg"));
        }

        if (latest.getSystolic() != null) {
            if (latest.getSystolic() > 140)
                alerts.add(new HealthAlertDto("danger",  "Blood Pressure", "Systolic BP above 140 mmHg — hypertension range",    latest.getSystolic() + "/" + latest.getDiastolic() + " mmHg"));
            else if (latest.getSystolic() > 130)
                alerts.add(new HealthAlertDto("warning", "Blood Pressure", "Elevated blood pressure — monitor closely",          latest.getSystolic() + "/" + latest.getDiastolic() + " mmHg"));
        }

        if (latest.getGlucose() != null) {
            if (latest.getGlucose() > 126)
                alerts.add(new HealthAlertDto("danger",  "Glucose", "Fasting glucose above 126 mg/dL — diabetic range", latest.getGlucose() + " mg/dL"));
            else if (latest.getGlucose() > 100)
                alerts.add(new HealthAlertDto("warning", "Glucose", "Pre-diabetic glucose level detected",              latest.getGlucose() + " mg/dL"));
        }

        if (alerts.isEmpty())
            alerts.add(new HealthAlertDto("info", "General", "All recorded values are within healthy ranges", "✓ Normal"));

        return alerts;
    }

    private BiometricResponse toResponse(BiometricEntry e) {
        BiometricResponse res = new BiometricResponse();
        res.setId(e.getId());
        res.setWeight(e.getWeight());
        res.setHeight(e.getHeight());
        res.setBmi(e.getBmi());
        res.setBodyFat(e.getBodyFat());
        res.setMuscleMass(e.getMuscleMass());
        res.setSystolic(e.getSystolic());
        res.setDiastolic(e.getDiastolic());
        res.setGlucose(e.getGlucose());
        res.setNotes(e.getNotes());
        res.setRecordedAt(e.getRecordedAt());
        return res;
    }
}