package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserStatsDTO {
    private long totalUsers;
    private long activeUsers;
    private long lockedUsers;
    private double profileCompletionRate;
}