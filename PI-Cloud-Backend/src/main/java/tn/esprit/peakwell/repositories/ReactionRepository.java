package tn.esprit.peakwell.repositories;

import tn.esprit.peakwell.entities.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByArticleId(Long articleId);
    Optional<Reaction> findByArticleIdAndUserIdentifier(Long articleId, String userIdentifier);
    Long countByArticleIdAndType(Long articleId, String type);
}
