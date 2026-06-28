package tn.esprit.peakwell.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import tn.esprit.peakwell.entities.User;

import java.util.*;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByKeycloakId(String keycloakId);
    User findByEmail(String email);
    @Query("""
    SELECT DISTINCT u FROM User u
    LEFT JOIN FETCH u.student
    LEFT JOIN FETCH u.dietitian
    """)
    List<User> findAllWithProfiles();
    List<User> findByAccountLockedTrue();

    // dasboard static

    // Total users
    long count();

    // Active users
    long countByEnabledTrue();

    // Locked users
    long countByAccountLockedTrue();

    // Profile completed
    long countByProfileCompletedTrue();
    List<User> findByRole(tn.esprit.peakwell.entities.Role role);

    // Role distribution
    @Query("SELECT u.role, COUNT(u) FROM User u GROUP BY u.role")
    List<Object[]> countUsersByRole();

    // Growth (per day)
    @Query("""
        SELECT DATE(u.createdAt), COUNT(u)
        FROM User u
        GROUP BY DATE(u.createdAt)
        ORDER BY DATE(u.createdAt)
    """)
    List<Object[]> getUserGrowth();

    // Top risky users
    @Query("""
        SELECT u.email, u.totalFailedAttempts 
        FROM User u 
        ORDER BY u.totalFailedAttempts DESC
    """)
    List<Object[]> getTopRiskUsers(Pageable pageable);

    // Failed attempts distribution
    @Query("""
        SELECT 
        SUM(CASE WHEN u.totalFailedAttempts <= 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN u.totalFailedAttempts BETWEEN 2 AND 4 THEN 1 ELSE 0 END),
        SUM(CASE WHEN u.totalFailedAttempts > 4 THEN 1 ELSE 0 END)
        FROM User u
    """)
    Object getFailedAttemptsStats();
}
