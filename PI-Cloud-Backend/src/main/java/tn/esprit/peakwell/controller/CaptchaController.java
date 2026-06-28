package tn.esprit.peakwell.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import tn.esprit.peakwell.dto.CaptchaChallenge;
import tn.esprit.peakwell.dto.CaptchaVerifyRequest;
import tn.esprit.peakwell.dto.CaptchaVerifyResponse;
import tn.esprit.peakwell.services.CaptchaTokenService;
import tn.esprit.peakwell.services.ICaptchaService;

import java.util.Map;

@RestController
@RequestMapping("/captcha")
public class CaptchaController {

    @Autowired
    private ICaptchaService captchaService;

    @Autowired
    private CaptchaTokenService captchaTokenService;


    @GetMapping("/challenge")
    public ResponseEntity<?> challenge() {
        try {
            CaptchaChallenge challenge = captchaService.generateChallenge();
            return ResponseEntity.ok(challenge);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to load challenge: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody CaptchaVerifyRequest request) {

        boolean valid = captchaService.verify(
                request.challengeToken(),
                request.selectedIndices()
        );

        if (!valid) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new CaptchaVerifyResponse(false, null,
                            "Wrong selection or expired challenge"));
        }

        String captchaToken = captchaTokenService.generateToken();
        return ResponseEntity.ok(
                new CaptchaVerifyResponse(true, captchaToken, null)
        );
    }
}
