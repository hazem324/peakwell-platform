package tn.esprit.peakwell.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {

    private Long id;
    private String content;
    private String author;
    private String ownerId;
    private LocalDateTime createdAt;
    private Long articleId;
    private Long parentCommentId;
    private List<CommentDTO> replies;
    private int upvotes;
    private int downvotes;
    private String moderationStatus;
}