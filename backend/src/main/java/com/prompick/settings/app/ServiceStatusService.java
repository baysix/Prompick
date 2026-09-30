package com.prompick.settings.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.settings.domain.AppSetting;
import com.prompick.settings.domain.AppSettingRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 제작을 받을지 말지.
 *
 * <p>배포 절차는 이렇다.
 *
 * <ol>
 *   <li>공지를 30분 전에 내보낸다
 *   <li>여기를 잠근다 — 이 순간부터 새 제작을 받지 않는다
 *   <li>이미 돌고 있는 작업이 끝나기를 기다린다 (늦어도 20분)
 *   <li>대기열이 빈 것을 확인하고 배포한다
 *   <li>푼다
 * </ol>
 *
 * <p>잠금 상태는 DB에 있다. 서버 메모리에 두면 배포할 때마다 초기화되어, 정작 배포하려고
 * 걸어둔 잠금이 배포와 함께 풀린다.
 */
@Service
public class ServiceStatusService {

    private static final Logger log = LoggerFactory.getLogger(ServiceStatusService.class);

    /** 이 서비스가 아는 유일한 설정 키 */
    private static final String KEY = "generation.lock";

    private static final String LOCKED = "locked";
    private static final String MESSAGE = "message";
    private static final String LOCKED_AT = "lockedAt";

    /** 관리자가 사유를 안 적었을 때 사용자에게 보여줄 말 */
    private static final String DEFAULT_MESSAGE = "잠시 점검 중이라 제작을 받지 않아요. 곧 다시 열려요.";

    private final AppSettingRepository settings;

    public ServiceStatusService(AppSettingRepository settings) {
        this.settings = settings;
    }

    /** 지금 잠겨 있는지. */
    @Transactional(readOnly = true)
    public GenerationLock current() {
        return settings.findById(KEY).map(ServiceStatusService::read).orElse(GenerationLock.open());
    }

    /**
     * 제작을 받을 수 있는 상태인지 확인하고, 아니면 막는다.
     *
     * <p>사용자에게는 관리자가 적어둔 사유를 그대로 보여준다. "오류가 발생했어요"로 뭉뚱그리면
     * 사용자는 자기 사진이 잘못된 줄 알고 계속 다시 시도한다.
     */
    @Transactional(readOnly = true)
    public void requireUnlocked() {
        GenerationLock lock = current();
        if (lock.locked()) {
            throw new ApiException(ErrorCode.GENERATION_LOCKED, lock.message());
        }
    }

    /** 잠근다. 이미 잠겨 있으면 사유와 시각을 새로 덮어쓴다. */
    @Transactional
    public GenerationLock lock(String message, Long adminId) {
        String reason = (message == null || message.isBlank()) ? DEFAULT_MESSAGE : message.trim();

        Map<String, Object> value = new LinkedHashMap<>();
        value.put(LOCKED, true);
        value.put(MESSAGE, reason);
        value.put(LOCKED_AT, Instant.now().toString());

        log.warn("제작 잠금: 관리자={} 사유={}", adminId, reason);
        return write(value, adminId);
    }

    /** 푼다. */
    @Transactional
    public GenerationLock unlock(Long adminId) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put(LOCKED, false);
        value.put(MESSAGE, null);
        value.put(LOCKED_AT, null);

        log.warn("제작 잠금 해제: 관리자={}", adminId);
        return write(value, adminId);
    }

    private GenerationLock write(Map<String, Object> value, Long adminId) {
        AppSetting setting = settings
                .findById(KEY)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.INTERNAL_ERROR, "제작 잠금 설정이 없어요. 마이그레이션을 확인해주세요."));
        setting.replace(value, adminId);
        return read(setting);
    }

    private static GenerationLock read(AppSetting setting) {
        Map<String, Object> value = setting.getValue();
        boolean locked = Boolean.TRUE.equals(value.get(LOCKED));
        if (!locked) {
            return GenerationLock.open();
        }

        Object message = value.get(MESSAGE);
        Object lockedAt = value.get(LOCKED_AT);

        return new GenerationLock(
                true,
                message == null ? DEFAULT_MESSAGE : message.toString(),
                parseInstant(lockedAt));
    }

    /**
     * 잠긴 시각을 읽는다.
     *
     * <p>못 읽어도 잠금 자체는 유효해야 한다. 시각 한 줄이 깨졌다고 예외를 던지면, 하필 배포를
     * 앞둔 순간에 잠금 기능 전체가 멈춘다. 시각은 화면에 보여주는 참고값일 뿐이다.
     */
    private static Instant parseInstant(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            return Instant.parse(raw.toString());
        } catch (RuntimeException e) {
            log.warn("잠금 시각을 읽지 못했다: {}", raw);
            return null;
        }
    }

    /**
     * @param message 잠겨 있을 때만 값이 있다
     * @param since 잠근 시각. 읽지 못했으면 비어 있다
     */
    public record GenerationLock(boolean locked, String message, Instant since) {
        static GenerationLock open() {
            return new GenerationLock(false, null, null);
        }
    }
}
