package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.SavedArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedArticleRepository extends JpaRepository<SavedArticle, Long> {
    Optional<SavedArticle> findByArticleIdAndUserIdentifier(Long articleId, String userIdentifier);
    List<SavedArticle> findByUserIdentifier(String userIdentifier);
    boolean existsByArticleIdAndUserIdentifier(Long articleId, String userIdentifier);
}
