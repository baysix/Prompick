package com.prompick.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI prompickOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("프롬픽 API")
                        .version("v1")
                        .description(
                                """
                                유행 프롬프트 아카이브 + 자동 제작 플랫폼.

                                주의: 사용자용 API 응답에는 파이프라인(내부 프롬프트, 모델명, 파라미터, 외부 작업 ID)이
                                절대 포함되지 않는다. 관리자용 DTO와 사용자용 DTO는 클래스 단위로 분리한다.
                                """));
    }
}
