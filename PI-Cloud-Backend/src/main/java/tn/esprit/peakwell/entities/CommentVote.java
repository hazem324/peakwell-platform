package tn.esprit.peakwell.entities;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comment_votes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentVote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @Column(nullable = false)
    private String voteType;

    @Column(nullable = false)
    private String userIdentifier;
}
