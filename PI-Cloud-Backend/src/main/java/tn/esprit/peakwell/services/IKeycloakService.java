package tn.esprit.peakwell.services;

public interface IKeycloakService {
    void forgotPassword(String email);

    void updateUserNames(String userId, String firstName, String lastName);

    // String createUser(RegisterRequest request);

    // void deleteUser(String userId);

    // void assignRole(String userId, String roleName);

    boolean verifyOldPassword(String email, String oldPassword);

    void updatePassword(String userId, String newPassword);

}
