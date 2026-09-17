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
     * 완성된 결과 파일을 가져온다.
     *
     * <p>외부 URL은 대개 만료되므로, 받아서 우리 스토리지로 옮긴 뒤 그 키를 돌려준다.
     */
    byte[] fetchResult(String externalJobId);

    /** 결과 파일의 형식 (image/png, video/mp4 등) */
    String resultContentType(String externalJobId);

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
