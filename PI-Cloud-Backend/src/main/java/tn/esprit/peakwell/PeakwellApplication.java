package tn.esprit.peakwell;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableAsync(proxyTargetClass = true)
public class PeakwellApplication {

    public static void main(String[] args) {
        SpringApplication.run(PeakwellApplication.class, args);
    }

}
