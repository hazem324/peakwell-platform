package tn.esprit.peakwell.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
 
@Data
@AllArgsConstructor
public class MostActiveUserDTO {
    private String email;
    private String fullName;
    private long activityCount;
}
