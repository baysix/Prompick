package com.prompick.common;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "공통")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "헬스체크", description = "서버가 살아있는지 확인한다.")
    public HealthResponse health() {
        return new HealthResponse("UP", "prompick-api", Instant.now());
    }

    public record HealthResponse(String status, String service, Instant time) {}
}
