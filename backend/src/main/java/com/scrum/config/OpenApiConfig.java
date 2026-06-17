package com.scrum.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI scrumOpenAPI() {
        return new OpenAPI().info(new Info()
            .title("Scrum 敏捷管理 API")
            .description("综合课设 Scrum 工具 RESTful API 文档")
            .version("1.0"));
    }
}
