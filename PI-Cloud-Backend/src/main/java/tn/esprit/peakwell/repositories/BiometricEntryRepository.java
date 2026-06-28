package tn.esprit.peakwell.repositories;


import tn.esprit.peakwell.entities.BiometricEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BiometricEntryRepository extends JpaRepository<BiometricEntry, Long> {
    List<BiometricEntry> findAllByOrderByRecordedAtAsc();
    Optional<BiometricEntry> findTopByOrderByRecordedAtDesc();
    Optional<BiometricEntry> findTopByProfileIdOrderByRecordedAtDesc(Long profileId);
    List<BiometricEntry> findByProfileIdOrderByRecordedAtAsc(Long profileId);
    List<BiometricEntry> findAllByProfileIdOrderByRecordedAtAsc(Long profileId);

}