package com.scrum;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.scrum.mapper")
public class ScrumApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScrumApplication.class, args);
    }
}
