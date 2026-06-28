package tn.esprit.peakwell.exception;


import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InappropriateContentException  extends RuntimeException {
        private final String category;
        private final List<String> detectedWords;

        public InappropriateContentException(String message, String category, List<String> detectedWords) {
            super(message);
            this.category = category;
            this.detectedWords = detectedWords;
        }

        public String getCategory() {
            return category;
        }

        public List<String> getDetectedWords() {
            return detectedWords;
        }
}
