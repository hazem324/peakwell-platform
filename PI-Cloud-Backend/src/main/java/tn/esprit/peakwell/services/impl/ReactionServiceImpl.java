package tn.esprit.peakwell.services.impl;

import tn.esprit.peakwell.dto.ReactionDTO;
import tn.esprit.peakwell.entities.Article;
import tn.esprit.peakwell.entities.Reaction;
import tn.esprit.peakwell.repositories.ArticleRepository;
import tn.esprit.peakwell.repositories.ReactionRepository;
import tn.esprit.peakwell.services.ReactionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional

public class ReactionServiceImpl implements ReactionService {
    private final ReactionRepository reactionRepository;
    private final ArticleRepository articleRepository;

    public ReactionServiceImpl(ReactionRepository reactionRepository, ArticleRepository articleRepository) {
        this.reactionRepository = reactionRepository;
        this.articleRepository = articleRepository;
    }

    @Override
    public void toggleReaction(Long articleId, String type, String userIdentifier) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        Optional<Reaction> existingReaction = reactionRepository.findByArticleIdAndUserIdentifier(articleId, userIdentifier);

        if (existingReaction.isPresent()) {
            Reaction reaction = existingReaction.get();
            if (reaction.getType().equals(type)) {
                // Same type, remove reaction
                reactionRepository.delete(reaction);
            } else {
                // Different type, update reaction
                reaction.setType(type);
                reactionRepository.save(reaction);
            }
        } else {
            // New reaction
            Reaction newReaction = Reaction.builder()
                    .type(type)
                    .userIdentifier(userIdentifier)
                    .article(article)
                    .build();
            reactionRepository.save(newReaction);
        }
    }

    @Override
    public List<ReactionDTO> getReactionsByArticle(Long articleId) {
        return reactionRepository.findByArticleId(articleId)
                .stream()
                .map(this::mapReactionToDTO)
                .toList();
    }

    @Override
    public Map<String, Long> getReactionCounts(Long articleId) {
        Map<String, Long> counts = new HashMap<>();
        String[] types = {"LIKE", "LOVE", "INSIGHTFUL", "IDEA", "BRAVO"};
        for (String type : types) {
            Long count = reactionRepository.countByArticleIdAndType(articleId, type);
            counts.put(type, count);
        }
        return counts;
    }

    private ReactionDTO mapReactionToDTO(Reaction reaction) {
        return new ReactionDTO(
                reaction.getId(),
                reaction.getType(),
                reaction.getUserIdentifier(),
                reaction.getArticle().getId()
        );
    }
}
