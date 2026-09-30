package com.prompick.settings.api;

import com.prompick.settings.app.ServiceStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 지금 제작을 받는지 알려준다.
 *
 * <p>로그인 없이 읽는다. 잠긴 사실은 만들기 버튼을 누르기 전에 알아야 의미가 있고, 화면은
 * 로그인하지 않은 사람에게도 보이기 때문이다.
 *
 * <p>막는 것은 이 응답이 아니라 서버다. 화면은 이 값으로 버튼을 미리 비활성화해 헛걸음을
 * 줄일 뿐이고, 실제 거절은 제작 요청을 받을 때 다시 확인한다.
 */
@RestController
@RequestMapping("/api/v1/service-status")
@Tag(name = "서비스 상태")
public class ServiceStatusController {

    private final ServiceStatusService serviceStatus;

    public ServiceStatusController(ServiceStatusService serviceStatus) {
        this.serviceStatus = serviceStatus;
    }

    @GetMapping
    @Operation(summary = "제작 가능 여부", description = "점검 준비 중이면 사유와 함께 잠김으로 답한다")
    public ServiceStatusResponse status() {
        ServiceStatusService.GenerationLock lock = serviceStatus.current();
        return new ServiceStatusResponse(lock.locked(), lock.message());
    }

    /**
     * @param generationLocked true면 지금 제작을 받지 않는다
     * @param message 잠겼을 때 사용자에게 보여줄 말. 열려 있으면 비어 있다
     */
    public record ServiceStatusResponse(boolean generationLocked, String message) {}
}
