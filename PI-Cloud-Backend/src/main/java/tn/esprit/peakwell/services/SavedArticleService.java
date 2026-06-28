package tn.esprit.peakwell.services;

import tn.esprit.peakwell.dto.SavedArticleDTO;

import java.util.List;

public interface SavedArticleService {
    void toggleSave(Long articleId, String userIdentifier);
    List<SavedArticleDTO> getSavedArticles(String userIdentifier);
    boolean isSaved(Long articleId, String userIdentifier);
}
