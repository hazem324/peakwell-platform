package tn.esprit.peakwell.services;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import tn.esprit.peakwell.dto.ActionStatusBreakdownDTO;
import tn.esprit.peakwell.dto.ActivityByHourDTO;
import tn.esprit.peakwell.dto.ActivityByTypeDTO;
import tn.esprit.peakwell.dto.ActivityDashboardDTO;
import tn.esprit.peakwell.dto.ActivityPerDayDTO;
import tn.esprit.peakwell.dto.ActivitySummaryDTO;
import tn.esprit.peakwell.dto.MostActiveUserDTO;
import tn.esprit.peakwell.dto.RecentActivityDTO;
import tn.esprit.peakwell.dto.TopIpDTO;
import tn.esprit.peakwell.dto.TopUserAgentDTO;
import tn.esprit.peakwell.entities.*;
import tn.esprit.peakwell.repositories.UserActivityRepository;

@Service
@RequiredArgsConstructor
public class UserActivityService implements IUserActivityService {

    private final UserActivityRepository userActivityRepository;

    @Override
    public void log(User user, ActivityType action, String description,
                    String status, HttpServletRequest request) {

        UserActivity activity = new UserActivity();
        activity.setUser(user);
        activity.setAction(action);
        activity.setDescription(description);
        activity.setStatus(status);

        // Use passed request, or fallback to current HTTP context
        HttpServletRequest req = request != null ? request : getCurrentRequest();

        if (req != null) {
            activity.setIpAddress(getClientIp(req));
            activity.setUserAgent(getUserAgent(req));
        } else {
            activity.setIpAddress("UNKNOWN");
            activity.setUserAgent("UNKNOWN");
        }

        userActivityRepository.save(activity);
    }

    // IP HANDLING
    private String getClientIp(HttpServletRequest request) {

        String ip = request.getHeader("X-Forwarded-For");

        // If behind proxy → take first IP
        if (ip != null && !ip.isBlank()) {
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getRemoteAddr();
        }

        // Normalize IPv6 localhost → IPv4
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            ip = "127.0.0.1";
        }

        return normalizeIp(ip);
    }

    // USER AGENT
    private String getUserAgent(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");

        if (ua == null || ua.isBlank()) {
            return "UNKNOWN";
        }

        return ua;
    }

    // CURRENT REQUEST 
    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        return (attrs != null) ? attrs.getRequest() : null;
    }

    // NORMALIZE IP 
    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "UNKNOWN";
        }

        try {
            InetAddress inet = InetAddress.getByName(ip);
            return inet.getHostAddress(); // returns normalized IPv4/IPv6
        } catch (Exception e) {
            return ip; // fallback if parsing fails
        }
    }
 
    @Override
    public ActivityDashboardDTO getDashboard() {
        return new ActivityDashboardDTO(
                getSummary(),
                getByType(),
                getRecentActivity(20),
                getActivityPerDay(),
                getFailedPerDay(),
                getTopIps(10),
                getTopUserAgents(10),
                getByHour(),
                getActionStatusBreakdown(),
                getMostActiveUsers(10)
        );
    }
 
    @Override
    public ActivitySummaryDTO getSummary() {
        try {
            long total = userActivityRepository.count();
            long success = userActivityRepository.countByStatus("SUCCESS");
            long failed = userActivityRepository.countByStatus("FAILED");
            double successRate = total > 0 ? (success * 100.0 / total) : 0.0;
 
            return new ActivitySummaryDTO(total, success, failed, successRate);
 
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching activity summary");
        }
    }
 
    @Override
    public List<ActivityByTypeDTO> getByType() {
        try {
            List<Object[]> results = userActivityRepository.countByActionType();
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No activity type data found");
            }
 
            return results.stream()
                    .map(obj -> new ActivityByTypeDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching activity by type");
        }
    }
 
    @Override
    public List<RecentActivityDTO> getRecentActivity(int limit) {
        try {
            List<UserActivity> results = userActivityRepository
                    .findRecentActivity(PageRequest.of(0, limit));
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No recent activity found");
            }
 
            return results.stream()
                    .map(a -> new RecentActivityDTO(
                            a.getId(),
                            a.getUser().getEmail(),
                            a.getUser().getFirstName() + " " + a.getUser().getLastName(),
                            a.getAction().name(),
                            a.getDescription(),
                            a.getStatus(),
                            a.getIpAddress(),
                            a.getUserAgent(),
                            a.getCreatedAt()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching recent activity");
        }
    }
 
    @Override
    public List<ActivityPerDayDTO> getActivityPerDay() {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(30);
            List<Object[]> results = userActivityRepository.activityPerDay(since);
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No activity data for the last 30 days");
            }
 
            return results.stream()
                    .map(obj -> new ActivityPerDayDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching activity per day");
        }
    }
 
    @Override
    public List<ActivityPerDayDTO> getFailedPerDay() {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(30);
            List<Object[]> results = userActivityRepository.failedAttemptsPerDay(since);
 
            if (results.isEmpty()) {
    return Collections.emptyList();
}
 
            return results.stream()
                    .map(obj -> new ActivityPerDayDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching failed attempts per day");
        }
    }
 
    @Override
    public List<TopIpDTO> getTopIps(int limit) {
        try {
            List<Object[]> results = userActivityRepository
                    .topIpAddresses(PageRequest.of(0, limit));
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No IP data found");
            }
 
            return results.stream()
                    .map(obj -> new TopIpDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching top IPs");
        }
    }
 
    @Override
    public List<TopUserAgentDTO> getTopUserAgents(int limit) {
        try {
            List<Object[]> results = userActivityRepository
                    .topUserAgents(PageRequest.of(0, limit));
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No user agent data found");
            }
 
            return results.stream()
                    .map(obj -> new TopUserAgentDTO(
                            obj[0].toString(),
                            ((Number) obj[1]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching top user agents");
        }
    }
 
    @Override
    public List<ActivityByHourDTO> getByHour() {
        try {
            List<Object[]> results = userActivityRepository.activityByHour();
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No hourly activity data found");
            }
 
            return results.stream()
                    .map(obj -> new ActivityByHourDTO(
                            ((Number) obj[0]).intValue(),
                            ((Number) obj[1]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching activity by hour");
        }
    }
 
    @Override
    public List<ActionStatusBreakdownDTO> getActionStatusBreakdown() {
        try {
            List<Object[]> results = userActivityRepository.actionStatusBreakdown();
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No action status data found");
            }
 
            return results.stream()
                    .map(obj -> new ActionStatusBreakdownDTO(
                            obj[0].toString(),
                            obj[1].toString(),
                            ((Number) obj[2]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching action status breakdown");
        }
    }
 
    @Override
    public List<MostActiveUserDTO> getMostActiveUsers(int limit) {
        try {
            List<Object[]> results = userActivityRepository
                    .mostActiveUsers(PageRequest.of(0, limit));
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No active users data found");
            }
 
            return results.stream()
                    .map(obj -> new MostActiveUserDTO(
                            (String) obj[0],
                            obj[1] + " " + obj[2],
                            ((Number) obj[3]).longValue()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching most active users");
        }
    }
 

 
    @Override
    public List<RecentActivityDTO> getUserActivity(Long userId, int limit) {
        try {
            List<UserActivity> results = userActivityRepository
                    .findByUserId(userId, PageRequest.of(0, limit));
 
            if (results.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No activity found for this user");
            }
 
            return results.stream()
                    .map(a -> new RecentActivityDTO(
                            a.getId(),
                            a.getUser().getEmail(),
                            a.getUser().getFirstName() + " " + a.getUser().getLastName(),
                            a.getAction().name(),
                            a.getDescription(),
                            a.getStatus(),
                            a.getIpAddress(),
                            a.getUserAgent(),
                            a.getCreatedAt()))
                    .toList();
 
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching user activity");
        }
    }
 


}