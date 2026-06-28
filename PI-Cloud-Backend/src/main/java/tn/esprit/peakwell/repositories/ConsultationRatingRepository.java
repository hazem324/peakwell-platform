package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.ConsultationRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ConsultationRatingRepository extends JpaRepository<ConsultationRating, Long> {
  Optional<ConsultationRating> findByConsultationId(Long consultationId);
  boolean existsByConsultationId(Long consultationId);

  @Query("SELECT AVG(r.overallRating) FROM ConsultationRating r JOIN r.consultation c WHERE c.doctorName = :doctorName")
  Double findAverageRatingByDoctorName(@Param("doctorName") String doctorName);

  @Query("SELECT COUNT(r) FROM ConsultationRating r JOIN r.consultation c WHERE c.doctorName = :doctorName")
  Long countRatingsByDoctorName(@Param("doctorName") String doctorName);
}