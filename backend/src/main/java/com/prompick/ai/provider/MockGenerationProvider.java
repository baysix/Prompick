package com.prompick.ai.provider;

import com.prompick.ai.domain.Provider;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 개발·테스트용 가짜 제공사.
 *
 * <p>실제 API는 호출할 때마다 돈이 든다. 제작 흐름 전체를 반복해서 확인해야 하는 개발 단계에서는
 * 그 비용이 금방 커지므로, 몇 초 기다렸다가 샘플 결과를 돌려주는 구현을 기본으로 둔다.
 *
 * <p>실패도 흉내 낼 수 있다. 실패했을 때 프롬비가 제대로 돌아오는지는 반드시 확인해야 하는데,
 * 실제 제공사로는 실패를 일부러 만들어 내기 어렵다.
 */
@Component
public class MockGenerationProvider implements GenerationProvider {

    private static final Logger log = LoggerFactory.getLogger(MockGenerationProvider.class);

    /** 제출된 가짜 작업들 */
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();

    /** 한 단계가 끝나는 데 걸리는 시간 */
    @Value("${prompick.mock.step-seconds:4}")
    private int stepSeconds;

    /** 실패를 흉내 낼 확률 (0.0 ~ 1.0) */
    @Value("${prompick.mock.failure-rate:0.0}")
    private double failureRate;

    @Override
    public Provider type() {
        return Provider.MOCK;
    }

    @Override
    public String submit(StepRequest request) {
        String id = "mock-" + UUID.randomUUID();
        boolean willFail = Math.random() < failureRate;
        jobs.put(id, new Job(Instant.now().plusSeconds(stepSeconds), willFail, request));

        // 프롬프트 원문은 로그에 남기지 않는다. 모델 이름만 기록한다.
        log.debug("가짜 작업 제출: {} (모델 {})", id, request.modelKey());
        return id;
    }

    @Override
    public StepStatus poll(String externalJobId) {
        Job job = jobs.get(externalJobId);
        if (job == null) {
            return StepStatus.FAILED;
        }
        if (Instant.now().isBefore(job.finishAt())) {
            return StepStatus.RUNNING;
        }
        return job.willFail() ? StepStatus.FAILED : StepStatus.SUCCEEDED;
    }

    @Override
    public byte[] fetchResult(String externalJobId) {
        Job job = jobs.get(externalJobId);
        String label = job == null ? "결과" : shortLabel(job.request());
        return MockMedia.placeholderSvg(label).getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    @Override
    public String resultContentType(String externalJobId) {
        return "image/svg+xml";
    }

    /** 결과 이미지에 적을 짧은 문구. 내부 프롬프트를 그대로 쓰지 않는다. */
    private String shortLabel(StepRequest request) {
        Object ratio = request.params().get("aspectRatio");
        return ratio == null ? "만들어진 결과" : "만들어진 결과 " + ratio;
    }

    private record Job(Instant finishAt, boolean willFail, StepRequest request) {}

    /** 개발용 결과 이미지를 그린다. 실제 제공사라면 파일을 내려받는 자리다. */
    static final class MockMedia {

        static String placeholderSvg(String label) {
            long seed = Math.abs(UUID.randomUUID().getMostSignificantBits());
            String[] palette = {"#2a3b34", "#4a3328", "#1c2833", "#3b3229", "#2f2a3d"};
            String bg = palette[(int) (seed % palette.length)];

            return """
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" width="720" height="1280">
                      <defs>
                        <radialGradient id="g" cx="50%%" cy="38%%" r="70%%">
                          <stop offset="0%%" stop-color="#ffffff" stop-opacity="0.32"/>
                          <stop offset="100%%" stop-color="%s" stop-opacity="1"/>
                        </radialGradient>
                      </defs>
                      <rect width="720" height="1280" fill="%s"/>
                      <rect width="720" height="1280" fill="url(#g)"/>
                      <rect x="250" y="420" width="220" height="300" rx="16" fill="#efe9dc"/>
                      <ellipse cx="360" cy="770" rx="110" ry="18" fill="#000" opacity="0.28"/>
                      <text x="360" y="1120" font-family="sans-serif" font-size="34"
                            fill="#ffffff" opacity="0.75" text-anchor="middle">%s</text>
                    </svg>
                    """
                    .formatted(bg, bg, label);
        }

        private MockMedia() {}
    }

    public Duration expectedDuration() {
        return Duration.ofSeconds(stepSeconds);
    }
}
