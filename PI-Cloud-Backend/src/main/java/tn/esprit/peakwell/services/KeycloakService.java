package tn.esprit.peakwell.services;

import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.peakwell.dto.RegisterRequest;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KeycloakService implements IKeycloakService {

    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.client-id}")
    private String clientId;

    @Value("${keycloak.server-url}")
    private String serverUrl;

    @Value("${keycloak.client-secret}")
    private String clientSecret;

    @Value("${app.verify-email-redirect-url}")
    private String verifyEmailRedirectUrl;

    public String createUser(RegisterRequest request) {

        try {

            System.out.println("TOKEN = " + keycloak.tokenManager().getAccessToken().getToken());

            System.out.println("EMAIL TO KEYCLOAK: " + request.getEmail());
            System.out.println("USERNAME TO KEYCLOAK: " + request.getFirstName());
            UserRepresentation user = new UserRepresentation();
            user.setEnabled(true);
            user.setEmail(request.getEmail());
            user.setUsername(request.getEmail());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmailVerified(false);

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(request.getPassword());
            credential.setTemporary(false);

            user.setCredentials(List.of(credential));

            Response response = keycloak.realm(realm).users().create(user);

            if (response.getStatus() != 201) {
                String error = response.readEntity(String.class);
                throw new RuntimeException("Keycloak error: " + response.getStatus() + " - " + error);
            }

            String location = response.getHeaderString("Location");
            String userId = location.substring(location.lastIndexOf("/") + 1);

            assignRole(userId, request.getRole());

            keycloak.realm(realm)
                    .users()
                    .get(userId)
                    .sendVerifyEmail(clientId);

            return userId;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e.getMessage());
        }
    }

    public void deleteUser(String userId) {
        keycloak.realm(realm)
                .users()
                .delete(userId);
    }

    public void assignRole(String userId, String roleName) {

        RoleRepresentation role = keycloak.realm(realm)
                .roles()
                .get(roleName)
                .toRepresentation();

        keycloak.realm(realm)
                .users()
                .get(userId)
                .roles()
                .realmLevel()
                .add(List.of(role));
    }

    @Override
    public void forgotPassword(String email) {

        try {

            if (email == null || email.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Email must not be null or empty");
            }

            List<UserRepresentation> users = keycloak.realm(realm)
                    .users()
                    .search(email, true);

            if (users.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found with this email");
            }

            String userId = users.get(0).getId();

            keycloak.realm(realm)
                    .users()
                    .get(userId)
                    .executeActionsEmail(
                            clientId,
                            "http://localhost:4200/auth/login",
                            300,
                            List.of("UPDATE_PASSWORD"));

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception e) {

            e.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Internal server error while processing forgot password");
        }
    }

    @Override
    public void updateUserNames(String userId, String firstName, String lastName) {

        try {

            UserRepresentation user = keycloak.realm(realm)
                    .users()
                    .get(userId)
                    .toRepresentation();

            if (user == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found in Keycloak");
            }

            // Update only if not null (PATCH behavior)
            if (firstName != null) {
                user.setFirstName(firstName);
            }

            if (lastName != null) {
                user.setLastName(lastName);
            }

            keycloak.realm(realm)
                    .users()
                    .get(userId)
                    .update(user);

        } catch (ResponseStatusException ex) {
            throw ex;

        } catch (Exception e) {
            e.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update user in Keycloak");
        }
    }



    @Override
public boolean verifyOldPassword(String username, String oldPassword) {

    if (username == null || oldPassword == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid credentials input");
    }

    try {
        Keycloak keycloakClient = KeycloakBuilder.builder()
                .serverUrl(serverUrl) //  from config
                .realm(realm)
                .clientId(clientId)
                .clientSecret(clientSecret) //  REQUIRED (your client is confidential)
                .grantType(OAuth2Constants.PASSWORD)
                .username(username) //  username NOT email
                .password(oldPassword)
                .build();

        keycloakClient.tokenManager().getAccessToken();

        return true;

    } catch (Exception e) {
        return false;
    }}

    @Override
    public void updatePassword(String userId, String newPassword) {

        if (userId == null || newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password data");
        }

        try {
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(newPassword);
            credential.setTemporary(false);

            keycloak.realm(realm)
                    .users()
                    .get(userId)
                    .resetPassword(credential);

        } catch (Exception e) {
            e.printStackTrace();

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to update password in Keycloak");
        }
    }

}
