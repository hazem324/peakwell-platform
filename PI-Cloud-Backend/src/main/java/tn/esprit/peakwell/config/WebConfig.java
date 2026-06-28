package tn.esprit.peakwell.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.*;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {
/* 
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String uploadPath = System.getProperty("user.dir") + "/uploads/";

    registry.addResourceHandler("/uploads/**")
      .addResourceLocations("file:" + uploadPath);
  }*/

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        String uploadPath = new File("uploads").getAbsolutePath();
        System.out.println("UPLOAD PATH = " + uploadPath);

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");
    } 
}
