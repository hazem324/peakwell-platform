package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.peakwell.entities.User;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findByUser(User user);
}

