package com.prompick.template.app;

import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인기 점수를 다시 센다.
 *
 * <p>여태 trend_score 는 아무도 갱신하지 않아 모든 템플릿이 0 이었다. 그래서 "이번 주 많이
 * 만든 것"이 실제로는 등록 역순이었고, 정작 가장 많이 만들어진 템플릿이 그 묶음에 없었다.
 *
 * <p>값을 더해 쌓지 않고 매번 처음부터 다시 센다. 더해 쌓는 방식은 한 번 어긋나면 되돌릴 길이
 * 없고, 작업이 실패하거나 환불되었을 때 빼는 것을 잊으면 점수가 조용히 부풀어 오른다. 원본이
 * 제작 내역에 그대로 있으므로 다시 세는 편이 언제나 맞다.
 *
 * <p>최근 것에 무게를 준다. 묶음의 이름이 "이번 주"인데 평생 누적으로 줄을 세우면, 한번
 * 올라간 템플릿이 계속 위에 남아 새 템플릿이 사람들 눈에 띌 기회를 얻지 못한다. 다만 이번 주에
 * 아무도 만들지 않은 날에는 전부 0 이 되어 줄이 무의미해지므로, 평생 횟수를 뒤에 남겨 순서를
 * 지탱한다.
 */
@Component
public class TrendScoreUpdater {

    private static final Logger log = LoggerFactory.getLogger(TrendScoreUpdater.class);

    /** "이번 주"의 길이 */
    private static final Duration RECENT_WINDOW = Duration.ofDays(7);

    /** 최근 한 건이 평생 한 건보다 몇 배 무거운지 */
    private static final int RECENT_WEIGHT = 10;

    private final TemplateScoreRepository scores;

    public TrendScoreUpdater(TemplateScoreRepository scores) {
        this.scores = scores;
    }

    /**
     * 뜨자마자 한 번 센다.
     *
     * <p>무료 플랜에서는 컨테이너가 자주 잠들고 다시 깨어난다. 깨어난 직후의 화면이 며칠 지난
     * 점수로 그려지지 않도록, 주기를 기다리지 않고 먼저 맞춘다.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        recompute();
    }

    @Scheduled(fixedDelayString = "${prompick.trend.refresh-ms:3600000}")
    @Transactional
    public void recompute() {
        try {
            int changed = scores.recompute(Instant.now().minus(RECENT_WINDOW), RECENT_WEIGHT);
            log.debug("인기 점수 갱신: {}건", changed);
        } catch (RuntimeException e) {
            // 점수가 조금 낡는 것보다 서비스가 멈추는 쪽이 훨씬 나쁘다.
            log.warn("인기 점수를 갱신하지 못했다: {}", e.toString());
        }
    }
}
