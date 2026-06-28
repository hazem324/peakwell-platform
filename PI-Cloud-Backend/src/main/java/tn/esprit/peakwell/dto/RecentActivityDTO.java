package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
import java.time.LocalDateTime;
 
@Data
@AllArgsConstructor
public class RecentActivityDTO {
    private Long id;
    private String userEmail;
    private String userFullName;
    private String action;
    private String description;
    private String status;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;
}
