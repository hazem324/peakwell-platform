package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Comment;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByArticleId(Long articleId);
    List<Comment> findByArticleIdAndParentCommentIsNull(Long articleId);
}
