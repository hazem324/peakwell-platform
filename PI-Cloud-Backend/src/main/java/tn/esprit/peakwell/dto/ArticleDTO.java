package tn.esprit.peakwell.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDTO {

    private Long id;
    private String title;
    private String content;
    private String author;
    private String ownerId;
    private String imageUrl;
    private String embedUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String aiSummary;
    private List<String> aiTags;
}