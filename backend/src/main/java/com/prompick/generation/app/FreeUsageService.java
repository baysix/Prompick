package com.prompick.generation.app;

import com.prompick.config.PrompickProperties;
import com.prompick.generation.domain.FreeUsageRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 무료 제작 횟수.
 *
 * <p>"오늘"은 한국 날짜다. 서버가 UTC로 돌아도 사용자에게는 한국 자정에 초기화되어야 한다.
 */
@Service
public class FreeUsageService {

    /** 무료 횟수가 초기화되는 기준 시간대 */
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final FreeUsageRepository usages;
    private final PrompickProperties properties;

    public FreeUsageService(FreeUsageRepository usages, PrompickProperties properties) {
        this.usages = usages;
        this.properties = properties;
    }

    public LocalDate today() {
        return LocalDate.now(KST);
    }

    public int dailyLimit() {
        return properties.free().dailyGenerateLimit();
    }

    /**
     * 오늘 한 번 쓴다.
     *
     * <p>확인과 차감이 한 번의 SQL로 이뤄진다. 따로 하면 동시에 들어온 두 요청이 같은 값을 읽어
     * 한도를 넘길 수 있다.
     *
     * @return 차감에 성공하면 true, 한도를 이미 다 썼으면 false
     */
    @Transactional
    public boolean tryConsume(Long userId) {
        return usages.tryConsume(userId, today(), dailyLimit()) > 0;
    }

    /**
     * 제작이 실패했을 때 횟수를 되돌린다.
     *
     * <p>바깥 트랜잭션과 분리한다. 실패 처리 도중 다른 오류가 나더라도 복구는 남아야 한다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void restore(Long userId, LocalDate usageDate) {
        usages.restore(userId, usageDate);
    }

    /** 오늘 남은 횟수 */
    @Transactional(readOnly = true)
    public int remaining(Long userId) {
        int used = usages
                .findById(new com.prompick.generation.domain.FreeUsageDaily.Key(userId, today()))
                .map(com.prompick.generation.domain.FreeUsageDaily::getUsedCount)
                .orElse(0);
        return Math.max(0, dailyLimit() - used);
    }
}
