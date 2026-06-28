package tn.esprit.peakwell.services;

public interface IAiService {
     String generateBanMessage(String reason);
     double compareFaces(String imageBase64, String storedImageUrl);
}
