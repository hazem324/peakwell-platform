package tn.esprit.peakwell.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedArticleDTO {
    private Long id;
    private String userIdentifier;
    private Long articleId;
    private LocalDateTime savedAt;

    // Article details for display
    private String articleTitle;
    private String articleAuthor;
    private LocalDateTime articleCreatedAt;
    private String articleImageUrl;
}
