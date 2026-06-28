package tn.esprit.peakwell.services;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.peakwell.dto.EventTrainingSampleDto;
import tn.esprit.peakwell.entities.SportEvent;

import java.time.LocalDateTime;

@Service
public class AiTrainingSyncService {

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendFinishedEventToFlask(SportEvent event) {
        EventTrainingSampleDto dto = buildTrainingSample(event);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<EventTrainingSampleDto> request = new HttpEntity<>(dto, headers);

        restTemplate.postForEntity(
                "http://localhost:5000/add-real-event",
                request,
                String.class
        );
    }

    public void callRetrain() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>("{}", headers);

        restTemplate.postForEntity(
                "http://localhost:5000/retrain",
                request,
                String.class
        );
    }

    private EventTrainingSampleDto buildTrainingSample(SportEvent event) {
        LocalDateTime dt = event.getEventDate();

        String governorate = extractGovernorate(event.getLocation());
        String successLevel = computeSuccessLevel(event);

        return new EventTrainingSampleDto(
                event.getCategory().name(),
                governorate,
                dt.getHour(),
                dt.getDayOfWeek().getValue() % 7,
                dt.getMonthValue(),
                event.getMaxParticipants(),
                successLevel
        );
    }

    private String computeSuccessLevel(SportEvent event) {
        if (event.getMaxParticipants() == null || event.getMaxParticipants() <= 0) {
            return "LOW";
        }

        double fillRate = (double) event.getCurrentParticipants() / event.getMaxParticipants();

        if (fillRate >= 0.8) {
            return "HIGH";
        } else if (fillRate >= 0.4) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    private String extractGovernorate(String location) {
        if (location == null || location.isBlank()) {
            return "Tunis";
        }

        String loc = location.toLowerCase();

        if (loc.contains("ariana")) return "Ariana";
        if (loc.contains("ben arous")) return "Ben Arous";
        if (loc.contains("manouba")) return "Manouba";
        if (loc.contains("nabeul")) return "Nabeul";
        if (loc.contains("zaghouan")) return "Zaghouan";
        if (loc.contains("bizerte")) return "Bizerte";
        if (loc.contains("beja")) return "Beja";
        if (loc.contains("jendouba")) return "Jendouba";
        if (loc.contains("kef")) return "Kef";
        if (loc.contains("siliana")) return "Siliana";
        if (loc.contains("kairouan")) return "Kairouan";
        if (loc.contains("kasserine")) return "Kasserine";
        if (loc.contains("sidi bouzid")) return "Sidi Bouzid";
        if (loc.contains("sousse")) return "Sousse";
        if (loc.contains("monastir")) return "Monastir";
        if (loc.contains("mahdia")) return "Mahdia";
        if (loc.contains("sfax")) return "Sfax";
        if (loc.contains("gabes")) return "Gabes";
        if (loc.contains("medenine")) return "Medenine";
        if (loc.contains("tataouine")) return "Tataouine";
        if (loc.contains("gafsa")) return "Gafsa";
        if (loc.contains("tozeur")) return "Tozeur";
        if (loc.contains("kebili")) return "Kebili";
        if (loc.contains("tunis")) return "Tunis";

        return "Tunis";
    }
}