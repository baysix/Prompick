package com.prompick.generation.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import com.prompick.generation.api.dto.JobResponse;
import com.prompick.generation.domain.*;
import com.prompick.generation.domain.JobRepository;
import com.prompick.generation.domain.OutputRepository;
import com.prompick.storage.StorageService;
import com.prompick.template.domain.Template;
import com.prompick.template.domain.TemplateRepository;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 작업 조회. 사용자에게 내보낼 형태로 바꾸는 일도 여기서 한다. */
@Service
@Transactional(readOnly = true)
public class JobQueryService {

    /**
     * 진행 중에 보여줄 문구.
     *
     * <p>"Higgsfield 호출 중" 같은 표현은 쓰지 않는다. 사용자가 알 필요가 없고, 알면 이 서비스를
     * 건너뛸 수 있다. 단계가 몇 개든 비슷한 흐름이라 세 단계 문구로 충분하다.
     */
    private static final String[] PROGRESS_MESSAGES = {
        "사진을 살펴보는 중이에요", "장면을 만드는 중이에요", "마무리하는 중이에요"
    };

    private final JobRepository jobs;
    private final OutputRepository outputs;
    private final TemplateRepository templates;
    private final StorageService storage;
    private final Duration signedUrlTtl;

    public JobQueryService(
            JobRepository jobs,
            OutputRepository outputs,
            TemplateRepository templates,
            StorageService storage,
            PrompickProperties properties) {
        this.jobs = jobs;
        this.outputs = outputs;
        this.templates = templates;
        this.storage = storage;
        this.signedUrlTtl = Duration.ofSeconds(properties.storage().signedUrlTtlSeconds());
    }

    public JobResponse get(Long userId, Long jobId) {
        GenerationJob job = jobs.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return toResponse(job, templateOf(job));
    }

    public List<JobResponse> list(Long userId, JobStatus status, int size) {
        List<GenerationJob> found = status == null
                ? jobs.findByUserIdOrderByIdDesc(userId, Limit.of(size))
                : jobs.findByUserIdAndStatusOrderByIdDesc(userId, status, Limit.of(size));

        // 템플릿을 한 번에 모아 읽는다. 목록마다 따로 조회하면 건수만큼 질의가 늘어난다.
        Map<Long, Template> templateMap = templates
                .findAllById(found.stream().map(GenerationJob::getTemplateId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Template::getId, Function.identity()));

        return found.stream().map(job -> toResponse(job, templateMap.get(job.getTemplateId()))).toList();
    }

    /** 결과물을 지운다. 파일도 함께 지운다. */
    @Transactional
    public void deleteOutputs(Long userId, Long jobId) {
        GenerationJob job = jobs.findByIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        for (GenerationOutput output : outputs.findByJobIdAndDeletedAtIsNull(job.getId())) {
            storage.delete(output.getStorageKey());
            output.markDeleted();
        }
    }

    private Template templateOf(GenerationJob job) {
        return templates.findById(job.getTemplateId()).orElse(null);
    }

    /**
     * 저장될 파일 이름.
     *
     * <p>스토리지 키는 UUID라 사람이 보면 무엇인지 알 수 없다. 받은 뒤 폴더에서 찾을 수 있게
     * 템플릿 이름을 붙여준다.
     */
    private static String downloadNameFor(Template template, String storageKey) {
        String extension = storageKey.contains(".")
                ? storageKey.substring(storageKey.lastIndexOf('.'))
                : ".png";

        String title = template == null ? "프롬픽" : template.getTitle();
        // 파일 이름에 쓸 수 없는 글자를 걷어낸다.
        return title.replaceAll("[\\/:*?\"<>|]", "").trim() + extension;
    }

    private JobResponse toResponse(GenerationJob job, Template template) {
        List<JobResponse.OutputResponse> outputResponses =
                job.getStatus() == JobStatus.SUCCEEDED
                        ? outputs.findByJobIdAndDeletedAtIsNull(job.getId()).stream()
                                .map(o -> new JobResponse.OutputResponse(
                                        o.getId(),
                                        o.getMediaType(),
                                        // 결과물은 비공개 버킷에 있다. 짧은 만료의 서명 주소로만 준다.
                                        storage.presignDownload(o.getStorageKey(), signedUrlTtl),
                                        storage.presignDownload(
                                                o.getStorageKey(),
                                                signedUrlTtl,
                                                downloadNameFor(template, o.getStorageKey())),
                                        o.isWatermarked(),
                                        o.getExpiresAt()))
                                .toList()
                        : List.of();

        return new JobResponse(
                job.getId(),
                job.getStatus(),
                template == null ? null : template.getSlug(),
                template == null ? "(삭제된 템플릿)" : template.getTitle(),
                job.getChargeType(),
                job.getCreditCostSnapshot(),
                job.getCurrentStep(),
                job.getTotalSteps(),
                messageFor(job),
                job.getErrorCode(),
                outputResponses,
                job.getCreatedAt(),
                job.getFinishedAt());
    }

    private String messageFor(GenerationJob job) {
        return switch (job.getStatus()) {
            case QUEUED -> "차례를 기다리는 중이에요";
            case RUNNING -> progressMessage(job);
            case SUCCEEDED -> "다 만들었어요";
            case FAILED -> "만들지 못했어요. 사용한 만큼 돌려드렸어요";
            case CANCELED -> "취소했어요";
        };
    }

    /** 전체 단계 수에 맞춰 문구를 고른다. 단계가 많아도 세 문구 안에서 움직인다. */
    private String progressMessage(GenerationJob job) {
        if (job.getTotalSteps() <= 1) {
            return PROGRESS_MESSAGES[1];
        }
        int index = job.getCurrentStep() * PROGRESS_MESSAGES.length / Math.max(1, job.getTotalSteps());
        return PROGRESS_MESSAGES[Math.min(index, PROGRESS_MESSAGES.length - 1)];
    }
}
