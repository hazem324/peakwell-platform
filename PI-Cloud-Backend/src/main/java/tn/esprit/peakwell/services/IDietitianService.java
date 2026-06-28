package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;

import tn.esprit.peakwell.dto.DietitianProfile;
import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.entities.User;

import java.util.List;
import java.util.Map;

@Service
public interface IDietitianService {
    void createDietitian(User user, ProfileRequest request);
    DietitianProfile getDietitianProfile(User user);
    void updateDietitianProfile(User user,  UpdateProfileRequest request);
    List<Map<String, Object>> getAllDietitians();

}
