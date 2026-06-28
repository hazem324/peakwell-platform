package tn.esprit.peakwell.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InappropriateContentException.class)
    public ResponseEntity<Map<String, Object>> handleInappropriateContent(
            InappropriateContentException ex) {

        String userMessage = switch (ex.getCategory()) {
            case "HATE_SPEECH" -> "⚠️ Your comment contains hate speech and has been blocked.";
            case "VIOLENCE" -> "⚠️ Your comment contains violent language and has been blocked.";
            case "SEXUAL" -> "⚠️ Your comment contains inappropriate sexual content and has been blocked.";
            case "PROFANITY" -> "⚠️ Your comment contains profanity. Please keep the discussion respectful.";
            case "SPAM" -> "⚠️ Your comment appears to be spam and has been blocked.";
            default -> "⚠️ Your comment was flagged as inappropriate. Please review and resubmit.";
        };

        Map<String, Object> error = new HashMap<>();
        error.put("error", "INAPPROPRIATE_CONTENT");
        error.put("category", ex.getCategory());
        error.put("detectedWords", ex.getDetectedWords());
        error.put("userMessage", userMessage);

        return ResponseEntity.badRequest().body(error);
    }
}
