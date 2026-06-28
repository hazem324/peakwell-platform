package tn.esprit.peakwell.services;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
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
import tn.esprit.peakwell.entities.ActivityType;
import tn.esprit.peakwell.entities.User;

public interface IUserActivityService {
        void log(User user,  ActivityType action,  String description, String status, HttpServletRequest request);

        // Dashboard (all stats in one call)
    ActivityDashboardDTO getDashboard();
 
    // Individual stats
    ActivitySummaryDTO getSummary();
    List<ActivityByTypeDTO> getByType();
    List<RecentActivityDTO> getRecentActivity(int limit);
    List<ActivityPerDayDTO> getActivityPerDay();
    List<ActivityPerDayDTO> getFailedPerDay();
    List<TopIpDTO> getTopIps(int limit);
    List<TopUserAgentDTO> getTopUserAgents(int limit);
    List<ActivityByHourDTO> getByHour();
    List<ActionStatusBreakdownDTO> getActionStatusBreakdown();
    List<MostActiveUserDTO> getMostActiveUsers(int limit);
 
    // Per-user
    List<RecentActivityDTO> getUserActivity(Long userId, int limit);
}
