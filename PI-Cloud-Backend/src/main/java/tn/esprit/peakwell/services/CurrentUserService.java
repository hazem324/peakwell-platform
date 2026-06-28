package tn.esprit.peakwell.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    /**
     * Get the current user ID from Keycloak JWT token (sub claim).
     * This is the Keycloak unique identifier for the user.
     * 
     * @return Keycloak user ID (sub claim), or null if not authenticated
     */
    public String getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return null;
            }

            // Try to extract from JWT token (Spring Security OAuth2 Resource Server pattern)
            if (auth.getPrincipal() instanceof Jwt jwt) {
                return jwt.getSubject();
            }

            // Fallback: use auth.getName() which returns the 'sub' claim
            return auth.getName();

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Get the current username from Keycloak JWT token (preferred_username claim).
     * Falls back to subject if preferred_username is not available.
     * 
     * @return Username or "Anonymous" if not authenticated
     */
    public String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return "Anonymous";
            }

            if (auth.getPrincipal() instanceof Jwt jwt) {
                String username = jwt.getClaimAsString("preferred_username");
                return username != null ? username : jwt.getSubject();
            }

            return auth.getName();

        } catch (Exception e) {
            return "Anonymous";
        }
    }

    /**
     * Check if there is an authenticated user
     * 
     * @return true if user is authenticated, false otherwise
     */
    public boolean isAuthenticated() {
        return getCurrentUserId() != null;
    }
}
