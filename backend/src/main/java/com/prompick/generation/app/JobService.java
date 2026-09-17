package com.prompick.generation.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import com.prompick.generation.domain.*;
import com.prompick.generation.domain.JobRepository;
import com.prompick.template.domain.*;
import com.prompick.user.domain.User;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 제작 요청 접수.
 *
 * <p>요청은 작업을 만들어두기만 하고 바로 응답한다. 실제 실행은 워커가 이어받는다.
 * 사용자가 화면을 닫아도 제작은 계속된다.
 *
 * <p>요금 차감과 작업 생성은 같은 트랜잭션에서 일어난다. 차감만 되고 작업이 안 만들어지면
 * 사용자는 아무것도 못 받고 횟수만 잃는다.
 */
@Service
public class JobService {

    private static final Logger log = LoggerFactory.getLogger(JobService.class);

    private final JobRepository jobs;
    private final TemplateRepository templates;
    private final TemplatePipelineRepository pipelines;
    private final UploadService uploads;
    private final FreeUsageService freeUsage;
    private final PrompickProperties properties;

    public JobService(
            JobRepository jobs,
            TemplateRepository templates,
            TemplatePipelineRepository pipelines,
            UploadService uploads,
            FreeUsageService freeUsage,
            PrompickProperties properties) {
        this.jobs = jobs;
        this.templates = templates;
        this.pipelines = pipelines;
        this.uploads = uploads;
        this.freeUsage = freeUsage;
        this.properties = properties;
    }

    /**
     * 제작을 요청한다.
     *
     * @param idempotencyKey 같은 키로 두 번 오면 작업을 하나만 만든다. 버튼 연타나 새로고침으로
     *     프롬비가 두 번 나가는 일을 막는다.
     */
    @Transactional
    public GenerationJob request(
            User user, String slug, Map<String, Object> inputs, String idempotencyKey) {

        // 이미 처리한 요청이면 그때 만든 작업을 그대로 돌려준다.
        var existing = jobs.findByUserIdAndIdempotencyKey(user.getId(), idempotencyKey);
        if (existing.isPresent()) {
            return existing.get();
        }

        Template template = templates
                .findPublishedBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.TEMPLATE_NOT_AVAILABLE));

        TemplatePipeline pipeline = pipelines
                .findByTemplateIdAndActiveTrue(template.getId())
                .orElseThrow(() -> new ApiException(ErrorCode.TEMPLATE_NOT_AVAILABLE));

        Map<String, Object> checkedInputs = validateInputs(user, template, inputs);

        ChargeType chargeType =
                template.getGenerateAccess() == GenerateAccess.FREE ? ChargeType.FREE : ChargeType.PAID;

        if (chargeType == ChargeType.FREE) {
            chargeFree(user);
        } else {
            chargePaid(user, template.getGenerateCost());
        }

        GenerationJob job = new GenerationJob(
                user.getId(),
                template.getId(),
                pipeline.getId(),
                chargeType,
                chargeType == ChargeType.PAID ? template.getGenerateCost() : 0,
                checkedInputs,
                pipeline.getSteps().size(),
                idempotencyKey);

        try {
            return jobs.saveAndFlush(job);
        } catch (DataIntegrityViolationException e) {
            // 같은 키로 동시에 두 요청이 들어온 경우. 먼저 저장된 것을 돌려준다.
            return jobs.findByUserIdAndIdempotencyKey(user.getId(), idempotencyKey)
                    .orElseThrow(() -> e);
        }
    }

    /**
     * 무료 제작. 본인인증과 오늘 남은 횟수를 확인한다.
     *
     * <p>본인인증을 요구할지는 설정으로 끌 수 있다. 인증 수단이 붙지 않은 개발 환경에서
     * 제작 흐름 전체를 막아버리지 않기 위해서다. 운영에서는 반드시 켠다 —
     * 이것이 없으면 계정을 여러 개 만들어 무료 횟수를 무제한으로 쓸 수 있다.
     */
    private void chargeFree(User user) {
        if (properties.free().requireIdentityVerification() && !user.isIdentityVerified()) {
            throw new ApiException(ErrorCode.IDENTITY_VERIFICATION_REQUIRED);
        }
        if (!freeUsage.tryConsume(user.getId())) {
            throw new ApiException(ErrorCode.FREE_LIMIT_EXCEEDED);
        }
    }

    /**
     * 유료 제작.
     *
     * <p>프롬비 지갑은 5단계에서 붙인다. 그때까지는 유료 제작을 막아 둔다. 잔액 확인 없이
     * 통과시키면 결제 기능이 붙는 순간 공짜로 만든 기록만 남는다.
     */
    private void chargePaid(User user, int cost) {
        throw new ApiException(
                ErrorCode.INSUFFICIENT_CREDIT, "유료 제작은 아직 열지 않았어요. 무료 템플릿을 먼저 써보세요.");
    }

    /** 템플릿이 요구하는 입력이 다 왔는지, 올린 사진이 쓸 수 있는지 확인한다. */
    private Map<String, Object> validateInputs(
            User user, Template template, Map<String, Object> inputs) {

        Map<String, Object> checked = new LinkedHashMap<>();
        List<String> missing = new ArrayList<>();

        for (TemplateInputField field : template.getInputFields()) {
            Object value = inputs.get(field.getFieldKey());

            if (value == null || (value instanceof String s && s.isBlank())) {
                if (field.isRequired()) {
                    missing.add(field.getLabel());
                }
                continue;
            }

            if (field.getFieldType() == TemplateInputField.FieldType.IMAGE) {
                Long uploadId = toLong(value);
                if (uploadId == null) {
                    missing.add(field.getLabel());
                    continue;
                }
                // 남의 업로드를 쓰거나 검사에서 막힌 사진을 쓰지 못하게 한다.
                uploads.requireUsable(user.getId(), uploadId);
                checked.put(field.getFieldKey(), uploadId);
            } else {
                checked.put(field.getFieldKey(), value);
            }
        }

        if (!missing.isEmpty()) {
            throw new ApiException(
                    ErrorCode.INVALID_REQUEST, String.join(", ", missing) + "이(가) 필요해요.");
        }
        return checked;
    }

    private static Long toLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
