package tn.esprit.peakwell.dto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class ReactionDTO {
    private Long id;
    private String type;
    private String userIdentifier;
    private Long articleId;
}
