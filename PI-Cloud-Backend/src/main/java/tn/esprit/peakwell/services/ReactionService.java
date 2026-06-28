package tn.esprit.peakwell.services;

import tn.esprit.peakwell.dto.ReactionDTO;
import tn.esprit.peakwell.entities.Article;
import tn.esprit.peakwell.entities.Reaction;
import java.util.List;
import java.util.Map;

public interface ReactionService {
    void toggleReaction(Long articleId, String type, String userIdentifier);
    List<ReactionDTO> getReactionsByArticle(Long articleId);
    Map<String, Long> getReactionCounts(Long articleId);
}
