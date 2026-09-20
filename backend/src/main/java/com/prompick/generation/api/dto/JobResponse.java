package com.prompick.generation.api.dto;

import com.prompick.generation.domain.ChargeType;
import com.prompick.generation.domain.JobStatus;
import com.prompick.template.domain.ContentType;
import java.time.Instant;
import java.util.List;

/**
 * 제작 작업 상태와 결과. 사용자용.
 *
 * <p>여기에는 어떤 AI를 쓰는지, 어떤 프롬프트로 도는지, 외부 작업 id가 무엇인지가 없다.
 * 진행 상황은 "몇 번째 단계인지"와 일반적인 문구로만 알려준다.
 */
public record JobResponse(
        Long id,
        JobStatus status,
        String templateSlug,
        String templateTitle,
        ChargeType chargeType,
        int creditCost,
        /** 지금 몇 번째 단계인지. 전체 단계 수와 함께 진행률을 만든다 */
        int currentStep,
        int totalSteps,
        /** 화면에 그대로 보여줄 문구. 내부 동작을 드러내지 않는다 */
        String statusMessage,
        /** 실패했을 때의 내부 에러 코드. 외부 응답 원문이 아니다 */
        String errorCode,
        List<OutputResponse> outputs,
        /** 이 템플릿이 보통 걸리는 시간(초). 화면이 남은 시간을 가늠하는 데 쓴다 */
        int estimatedSeconds,
        Instant createdAt,
        /** 실제로 일을 시작한 시각. 큐에서 기다린 시간을 진행률에 섞지 않으려면 이쪽을 쓴다 */
        Instant startedAt,
        Instant finishedAt) {

    /**
     * @param url 화면에 띄울 주소
     * @param downloadUrl 파일로 저장할 주소. 브라우저가 새 탭에 띄우지 않게 표시가 붙어 있다
     */
    public record OutputResponse(
            Long id,
            ContentType mediaType,
            String url,
            String downloadUrl,
            boolean watermarked,
            Instant expiresAt) {}
}
