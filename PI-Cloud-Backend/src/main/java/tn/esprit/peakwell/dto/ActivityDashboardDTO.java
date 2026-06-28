package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
import java.util.List;
 
@Data
@AllArgsConstructor
public class ActivityDashboardDTO {
    private ActivitySummaryDTO summary;
    private List<ActivityByTypeDTO> byType;
    private List<RecentActivityDTO> recentActivity;
    private List<ActivityPerDayDTO> activityPerDay;
    private List<ActivityPerDayDTO> failedPerDay;
    private List<TopIpDTO> topIps;
    private List<TopUserAgentDTO> topUserAgents;
    private List<ActivityByHourDTO> byHour;
    private List<ActionStatusBreakdownDTO> actionStatusBreakdown;
    private List<MostActiveUserDTO> mostActiveUsers;
}