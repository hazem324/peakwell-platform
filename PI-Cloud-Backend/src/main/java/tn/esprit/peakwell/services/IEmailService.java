package tn.esprit.peakwell.services;

import java.util.Map;

import tn.esprit.peakwell.entities.User;

public interface IEmailService {
    
    void sendAccountStatusEmail(String to, String subject, String templateName, Map<String, Object> variables);

    void sendAccountLockedEmail(User user);

    void sendAccountUnlockedEmail(User user);
}
