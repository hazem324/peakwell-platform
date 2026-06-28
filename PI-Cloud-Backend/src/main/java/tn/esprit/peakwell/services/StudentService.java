package tn.esprit.peakwell.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import tn.esprit.peakwell.dto.ProfileRequest;
import tn.esprit.peakwell.dto.StudentProfile;
import tn.esprit.peakwell.dto.UpdateProfileRequest;
import tn.esprit.peakwell.entities.Student;
import tn.esprit.peakwell.entities.User;

@Service
public class StudentService implements IStudentService {


    @Override
    public void createStudent(User user, ProfileRequest request) {

        Student student = user.getStudent();

        if (student == null) {
            student = new Student();
            student.setUser(user);
        }

        student.setHeight(request.getHeight());
        student.setWeight(request.getWeight());
        student.setActivityLevel(request.getActivityLevel());
        student.setGoal(request.getGoal());

        // BMI calculation
        float heightMeters = request.getHeight() / 100;
        float bmi = (float) (request.getWeight() / (heightMeters * heightMeters));
        student.setBmi(Math.round(bmi * 100) / 100f);


        user.setStudent(student);
    }

    @Override
public void updateStudentProfile(User user, UpdateProfileRequest request) {

    Student student = user.getStudent();

    if (student == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Student profile not found");
    }

    //  Validation
    if (request.getHeight() != null && request.getHeight() <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid height");
    }

    if (request.getWeight() != null && request.getWeight() <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid weight");
    }

    //  Update fields
    if (request.getHeight() != null) {
        student.setHeight(request.getHeight());
    }

    if (request.getWeight() != null) {
        student.setWeight(request.getWeight());
    }

    if (request.getActivityLevel() != null) {
        student.setActivityLevel(request.getActivityLevel());
    }

    if (request.getGoal() != null) {
        student.setGoal(request.getGoal());
    }


    // Recalculate BMI safely
    if (student.getHeight() != null && student.getWeight() != null) {

        float heightMeters = student.getHeight() / 100;
        float bmi = student.getWeight() / (heightMeters * heightMeters);

        student.setBmi(Math.round(bmi * 100) / 100f);
    }
}

    @Override
    public StudentProfile getStudentProfile(User user) {

        Student student = user.getStudent();

        if (student == null) {
            return null;
        }

        StudentProfile sp = new StudentProfile();
        sp.setWeight(student.getWeight() != null ? student.getWeight().doubleValue() : null);
        sp.setHeight(student.getHeight() != null ? student.getHeight().doubleValue() : null);
        sp.setActivityLevel(student.getActivityLevel());
        sp.setGoal(student.getGoal());

        return sp;
    }


}
