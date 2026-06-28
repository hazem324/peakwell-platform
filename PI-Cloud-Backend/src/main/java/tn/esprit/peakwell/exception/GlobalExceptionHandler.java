package tn.esprit.peakwell.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", 400);
        response.put("errors", fieldErrors);

        return ResponseEntity.badRequest().body(response);
    }


    @ExceptionHandler(StockException.class)
    public ResponseEntity<Map<String, Object>> handleStockException(StockException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", 400);
        response.put("error", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    //  HANDLE ResponseStatusException (401, 403, 404, etc.)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", ex.getStatusCode().value());
        response.put("error", ex.getReason());

        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", 400);
        response.put("error", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    //  GLOBAL ERROR (fallback)
    // GLOBAL ERROR
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", 500);
        response.put("error", "Internal Server Error");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

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


    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(
            UnauthorizedException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", 403);
        error.put("error", "FORBIDDEN");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
}