package tn.esprit.peakwell.services.impl;

import tn.esprit.peakwell.entities.SavedArticle;
import tn.esprit.peakwell.entities.Article;
import tn.esprit.peakwell.repositories.SavedArticleRepository;
import tn.esprit.peakwell.repositories.ArticleRepository;
import tn.esprit.peakwell.dto.SavedArticleDTO;
import tn.esprit.peakwell.services.SavedArticleService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SavedArticleServiceImpl implements SavedArticleService {
    private final SavedArticleRepository savedArticleRepository;
    private final ArticleRepository articleRepository;

    public SavedArticleServiceImpl(SavedArticleRepository savedArticleRepository,
                                   ArticleRepository articleRepository) {
        this.savedArticleRepository = savedArticleRepository;
        this.articleRepository = articleRepository;
    }

    @Override
    public void toggleSave(Long articleId, String userIdentifier) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + articleId));

        Optional<SavedArticle> existing = savedArticleRepository.findByArticleIdAndUserIdentifier(articleId, userIdentifier);

        if (existing.isPresent()) {
            // Remove saved article
            savedArticleRepository.delete(existing.get());
        } else {
            // Save article
            SavedArticle savedArticle = SavedArticle.builder()
                    .userIdentifier(userIdentifier)
                    .article(article)
                    .build();
            savedArticleRepository.save(savedArticle);
        }
    }

    @Override
    public List<SavedArticleDTO> getSavedArticles(String userIdentifier) {
        return savedArticleRepository.findByUserIdentifier(userIdentifier)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public boolean isSaved(Long articleId, String userIdentifier) {
        return savedArticleRepository.existsByArticleIdAndUserIdentifier(articleId, userIdentifier);
    }

    private SavedArticleDTO mapToDTO(SavedArticle savedArticle) {
        return new SavedArticleDTO(
                savedArticle.getId(),
                savedArticle.getUserIdentifier(),
                savedArticle.getArticle().getId(),
                savedArticle.getSavedAt(),
                savedArticle.getArticle().getTitle(),
                savedArticle.getArticle().getAuthor(),
                savedArticle.getArticle().getCreatedAt(),
                savedArticle.getArticle().getImageUrl()
        );
    }
}
