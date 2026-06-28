package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.MedicalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicalProfileRepository extends JpaRepository<MedicalProfile, Long> {
  Optional<MedicalProfile> findByStudentId(Long studentId);
  List<MedicalProfile> findByAssignedDietitianId(Long dietitianId);
  Optional<MedicalProfile> findFirstByOrderByIdAsc();

  /** All profiles assigned to this dietitian OR that have at least one consultation with them */
  @Query("""
      SELECT DISTINCT p FROM MedicalProfile p
      WHERE p.assignedDietitian.id = :dietitianId
         OR EXISTS (
              SELECT 1 FROM Consultation c
              WHERE c.profile = p
                AND c.dietitian.id = :dietitianId
                AND c.status != 'CANCELLED'
            )
      """)
  List<MedicalProfile> findByDietitianScope(@Param("dietitianId") Long dietitianId);
}