package tn.esprit.peakwell.services;

import org.springframework.stereotype.Service;

import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.StudentProfile;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.entities.User;

@Service
public interface IStudentService {


    void createStudent(User user, ProfileRequest request);
    StudentProfile getStudentProfile(User user);
    void updateStudentProfile(User user,  UpdateProfileRequest request);


}
