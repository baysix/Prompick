package com.prompick.template.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 실행용 파이프라인. <b>관리자 전용이며 사용자에게 절대 노출되지 않는다.</b>
 *
 * <p>단계마다 어떤 AI 모델을 쓸지 관리자가 고른다. 한 템플릿 안에서 단계별로 제공사가 달라도 된다.
 * 예: Gemini로 제품을 인식 → GPT 이미지로 장면 생성 → Higgsfield로 영상화.
 *
 * <p>수정할 때는 기존 행을 고치지 않고 새 버전을 만든다. 진행 중인 작업이 요청 시점 버전을 그대로
 * 사용하게 하기 위해서다.
 */
@Entity
@Table(name = "template_pipelines")
public class TemplatePipeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(nullable = false)
    private int version;

    /** 템플릿당 하나만 true. DB 부분 유니크 인덱스로도 강제된다 */
    @Column(nullable = false)
    private boolean active;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> steps = new ArrayList<>();

    @Column(name = "admin_memo", columnDefinition = "text")
    private String adminMemo;

    protected TemplatePipeline() {}

    public TemplatePipeline(
            Long templateId, int version, boolean active, List<Map<String, Object>> steps, String adminMemo) {
        this.templateId = templateId;
        this.version = version;
        this.active = active;
        this.steps = steps == null ? new ArrayList<>() : steps;
        this.adminMemo = adminMemo;
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public int getVersion() {
        return version;
    }

    public boolean isActive() {
        return active;
    }

    public List<Map<String, Object>> getSteps() {
        return steps;
    }

    public String getAdminMemo() {
        return adminMemo;
    }
}
