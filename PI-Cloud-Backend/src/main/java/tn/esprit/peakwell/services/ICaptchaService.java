package tn.esprit.peakwell.services;

import java.util.List;

import tn.esprit.peakwell.dto.CaptchaChallenge;

public interface ICaptchaService {

    
    CaptchaChallenge generateChallenge() throws Exception;

    
    boolean verify(String challengeToken, List<Integer> selected);
}