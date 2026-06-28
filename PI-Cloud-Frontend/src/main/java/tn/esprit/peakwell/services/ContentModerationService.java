package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;
import tn.esprit.peakwell.dto.ModerationResult;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentModerationService {

    // Comprehensive list of inappropriate words (French + English)
    private static final List<String> INAPPROPRIATE_WORDS = List.of(
        // English - Mild
        "stupid", "idiot", "dumb", "fool", "loser", "trash", "garbage",
        "hate", "hater", "stupidity", "ignorant", "annoying",
        
        // English - Severe
        "fuck", "shit", "bitch", "asshole", "damn", "bastard",
        "racist", "racism", "nigger", "nigga", "slut", "whore",
        "porn", "sex", "nude", "naked", "violence", "kill", "murder",
        "suicide", "death", "threat", "terror", "bomb",
        
        // French - Mild
        "imbécile", "crétin", "stupide", "con", "nul",
        "haine", "détestable", "agaçant", "emmerdant",
        
        // French - Severe
        "putain", "merde", "salope", "connard", "enculé", "bordel",
        "foutre", "chier", "bite", "couilles", "sexe", "cul",
        "raciste", "violence", "tuer", "mort", "suicide",
        "pornographie", "porno", "nu",
        
        // Spam/Scam
        "spam", "scam", "arnaque", "fake", "fraud", "escroc",
        "click here", "subscribe", "abonnement", "gratuit", "free money",
        "bitcoin", "crypto", "investment", "gain rapide"
    );

    // Check if content contains inappropriate words
    public ModerationResult checkContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return ModerationResult.allowed();
        }

        String lowerContent = content.toLowerCase().trim();
        List<String> detectedWords = new ArrayList<>();

        for (String word : INAPPROPRIATE_WORDS) {
            if (lowerContent.contains(word.toLowerCase())) {
                detectedWords.add(word);
            }
        }

        if (!detectedWords.isEmpty()) {
            return new ModerationResult(
                false,
                detectedWords,
                categorize(detectedWords)
            );
        }

        return ModerationResult.allowed();
    }

    private String categorize(List<String> words) {
        for (String word : words) {
            String lower = word.toLowerCase();
            if (lower.matches(".*(racist|racisme|nigger|nigga).*")) return "HATE_SPEECH";
            if (lower.matches(".*(kill|murder|suicide|death|threat|terror|bomb).*")) return "VIOLENCE";
            if (lower.matches(".*(porn|sex|nude|naked|slut|whore).*")) return "SEXUAL";
            if (lower.matches(".*(fuck|shit|bitch|asshole|putain|merde|salope|connard).*")) return "PROFANITY";
            if (lower.matches(".*(spam|scam|fake|fraud|bitcoin|crypto).*")) return "SPAM";
        }
        return "INAPPROPRIATE";
    }

    // Censor bad words with ***
    public String censorContent(String content) {
        if (content == null) return null;
        String result = content;
        for (String word : INAPPROPRIATE_WORDS) {
            result = result.replaceAll(
                "(?i)\\b" + Pattern.quote(word) + "\\b",
                "*".repeat(word.length())
            );
        }
        return result;
    }
}
