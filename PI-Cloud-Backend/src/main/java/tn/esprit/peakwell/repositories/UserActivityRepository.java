package tn.esprit.peakwell.repositories;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.peakwell.entities.UserActivity;
 
import java.time.LocalDateTime;
import java.util.List;

public interface UserActivityRepository extends JpaRepository<UserActivity, Long>{
 

     //  Total count by status
    long countByStatus(String status);
 
    //  Count by action type
    @Query("SELECT a.action, COUNT(a) FROM UserActivity a GROUP BY a.action ORDER BY COUNT(a) DESC")
    List<Object[]> countByActionType();
 
    //  Recent activity feed 
    @Query("SELECT a FROM UserActivity a JOIN FETCH a.user ORDER BY a.createdAt DESC")
    List<UserActivity> findRecentActivity(Pageable pageable);
 
    // Failed attempts per day 
    @Query("""
        SELECT CAST(a.createdAt AS date), COUNT(a)
        FROM UserActivity a
        WHERE a.status = 'FAILED'
        AND a.createdAt >= :since
        GROUP BY CAST(a.createdAt AS date)
        ORDER BY CAST(a.createdAt AS date)
    """)
    List<Object[]> failedAttemptsPerDay(LocalDateTime since);
 
    // Top IPs 
    @Query("SELECT a.ipAddress, COUNT(a) FROM UserActivity a WHERE a.ipAddress IS NOT NULL GROUP BY a.ipAddress ORDER BY COUNT(a) DESC")
    List<Object[]> topIpAddresses(Pageable pageable);
 
    //  User agent breakdown 
    @Query("SELECT a.userAgent, COUNT(a) FROM UserActivity a WHERE a.userAgent IS NOT NULL GROUP BY a.userAgent ORDER BY COUNT(a) DESC")
    List<Object[]> topUserAgents(Pageable pageable);
 
    //  Activity by hour of day 
    @Query("SELECT FUNCTION('HOUR', a.createdAt), COUNT(a) FROM UserActivity a GROUP BY FUNCTION('HOUR', a.createdAt) ORDER BY FUNCTION('HOUR', a.createdAt)")
    List<Object[]> activityByHour();
 
    //  Activity per day 
    @Query("""
        SELECT CAST(a.createdAt AS date), COUNT(a)
        FROM UserActivity a
        WHERE a.createdAt >= :since
        GROUP BY CAST(a.createdAt AS date)
        ORDER BY CAST(a.createdAt AS date)
    """)
    List<Object[]> activityPerDay(LocalDateTime since);
 
    // Per-user activity log 
    @Query("SELECT a FROM UserActivity a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    List<UserActivity> findByUserId(Long userId, Pageable pageable);
 
    //  Success vs Failed per action type 
    @Query("SELECT a.action, a.status, COUNT(a) FROM UserActivity a GROUP BY a.action, a.status ORDER BY a.action")
    List<Object[]> actionStatusBreakdown();
 
    //  Most active users 
    @Query("""
        SELECT u.email, u.firstName, u.lastName, COUNT(a)
        FROM UserActivity a
        JOIN a.user u
        GROUP BY u.id, u.email, u.firstName, u.lastName
        ORDER BY COUNT(a) DESC
    """)
    List<Object[]> mostActiveUsers(Pageable pageable);

}
