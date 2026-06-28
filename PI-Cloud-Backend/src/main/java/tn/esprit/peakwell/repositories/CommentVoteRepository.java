package tn.esprit.peakwell.repositories;


import tn.esprit.peakwell.entities.CommentVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface CommentVoteRepository extends JpaRepository<CommentVote, Long> {
    Optional<CommentVote> findByCommentIdAndUserIdentifier(Long commentId, String userIdentifier);
}
