package tn.esprit.peakwell.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;


import tn.esprit.peakwell.services.IAiService;

@RestController
@RequestMapping("/ai")
public class AiController {

    @Autowired
    IAiService iAiService;

    @PostMapping("/generate-ban")
    public String generateBan(@RequestBody Map<String, String> body) {
        String reason = body.get("reason");

        // call service
        return iAiService.generateBanMessage(reason);
    }

}