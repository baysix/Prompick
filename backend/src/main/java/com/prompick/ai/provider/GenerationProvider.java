package com.prompick.ai.provider;

import com.prompick.ai.domain.Provider;
import java.util.Map;

/**
 * 외부 AI 제공사 어댑터.
 *
 * <p>제공사마다 호출 방식이 다르지만 파이프라인 실행기는 그 차이를 몰라야 한다.
 * 한 템플릿 안에서 단계마다 다른 제공사를 쓰는 것도 이 인터페이스 덕분에 가능하다.
 *
 * <p>제출과 결과 확인을 나눈 이유: 영상 생성은 수십 초에서 수 분이 걸린다. 한 번의 호출로
 * 기다리면 워커 스레드가 묶이고, 서버가 재시작되면 진행 상황을 잃는다.
 */
public interface GenerationProvider {

    Provider type();

    /**
     * 외부에 작업을 제출한다.
     *
     * @return 이후 상태를 확인할 때 쓸 외부 작업 id
     */
    String submit(StepRequest request);

    /** 진행 상태를 확인한다. */
    StepStatus poll(String externalJobId);

    /**
     * 완성된 결과를 연다. 외부 URL은 대개 만료되므로 받는 즉시 우리 스토리지로 옮긴다.
     *
     * <p>바이트 배열이 아니라 스트림으로 돌려주는 이유가 있다. 영상은 수십 MB가 흔한데, 통째로
     * 메모리에 올리면 512MB 컨테이너는 그대로 죽는다. 이미지만 다루던 시절에는 버텼지만 그때도
     * 아슬아슬했다.
     *
     * <p>호출자가 닫는다.
     */
    ResultStream openResult(String externalJobId);

    /**
     * 열린 결과.
     *
     * @param contentType image/png, video/mp4 등
     * @param contentLength 바이트 수. 제공사가 알려주지 않으면 -1. 그 경우 호출자가 임시 파일로
     *     받아 길이를 확정한다 — 역시 메모리에는 담지 않는다.
     */
    record ResultStream(java.io.InputStream content, String contentType, long contentLength)
            implements AutoCloseable {

        @Override
        public void close() {
            try {
                content.close();
            } catch (java.io.IOException ignored) {
                // 이미 다 받은 뒤다. 닫다 난 오류로 제작을 실패시킬 이유가 없다.
            }
        }
    }

    /**
     * 키가 살아 있는지 확인한다.
     *
     * <p>운영자가 키를 넣고 나서 실제로 되는지 알 방법이 없으면, 사용자가 제작을 눌러 실패할 때에야
     * 알게 된다. 그때는 이미 늦다. 돈이 들지 않는 호출로 미리 확인할 수 있게 한다.
     */
    default ProviderCheck check() {
        return new ProviderCheck(false, "이 제공사는 연결 확인을 지원하지 않아요", java.util.List.of());
    }

    /**
     * @param models 계정에서 쓸 수 있는 모델 이름. 파이프라인에 적은 이름이 여기 없으면 실패한다
     */
    record ProviderCheck(boolean ok, String message, java.util.List<String> models) {}

    /**
     * 한 단계의 실행 요청.
     *
     * @param modelKey 제공사 안에서의 모델 이름
     * @param prompt 변수가 치환된 내부 프롬프트
     * @param params 모델별 파라미터
     * @param inputFiles 앞 단계 결과나 사용자 업로드 (키 → 스토리지 키)
     */
    record StepRequest(
            String modelKey,
            String prompt,
            Map<String, Object> params,
            Map<String, String> inputFiles) {}

    enum StepStatus {
        RUNNING,
        SUCCEEDED,
        FAILED
    }
}
