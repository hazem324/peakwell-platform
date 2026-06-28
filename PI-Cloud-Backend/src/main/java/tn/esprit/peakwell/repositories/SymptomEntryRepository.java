package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.SymptomEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface SymptomEntryRepository extends JpaRepository<SymptomEntry, Long> {

  List<SymptomEntry> findByLogDateOrderByCreatedAtDesc(LocalDate logDate);

  List<SymptomEntry> findByLogDateBetweenOrderByLogDateAsc(LocalDate start, LocalDate end);

  List<SymptomEntry> findAllByOrderByLogDateDesc();

  List<SymptomEntry> findBySymptomIgnoreCaseOrderByLogDateDesc(String symptom);

  List<SymptomEntry> findTop10ByProfileIdOrderByLogDateDesc(Long profileId);


  @Query("SELECT DISTINCT s.symptom FROM SymptomEntry s ORDER BY s.symptom")
  List<String> findDistinctSymptoms();

  @Query("SELECT s.symptom, COUNT(s) as cnt FROM SymptomEntry s GROUP BY s.symptom ORDER BY cnt DESC")
  List<Object[]> findSymptomFrequencies();

  List<SymptomEntry> findTop30ByOrderByLogDateDesc();
  List<SymptomEntry> findTop10ByOrderByLogDateDesc();
  List<SymptomEntry> findByProfileIdAndLogDateBetweenOrderByLogDateAsc(Long profileId, LocalDate start, LocalDate end);

}
