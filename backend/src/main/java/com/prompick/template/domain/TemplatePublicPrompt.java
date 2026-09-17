package com.prompick.template.domain;

import jakarta.persistence.*;

/**
 * 공개용 프롬프트 원문.
 *
 * <p>사용자가 복사해서 다른 AI 서비스에 붙여넣는 용도다. 실행용 파이프라인과는 다른 테이블이고 다른 내용이다.
 * 이 값이 공개되어도 파이프라인의 품질은 재현되지 않는다.
 */
@Entity
@Table(name = "template_public_prompts")
public class TemplatePublicPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "negative_prompt", columnDefinition = "text")
    private String negativePrompt;

    /** 어디에 붙여넣으면 되는지 (예: Midjourney v7) */
    @Column(name = "recommended_tool", length = 100)
    private String recommendedTool;

    @Column(name = "usage_tip", columnDefinition = "text")
    private String usageTip;

    protected TemplatePublicPrompt() {}

    public TemplatePublicPrompt(Long templateId) {
        this.templateId = templateId;
    }

    public void update(String body, String negativePrompt, String recommendedTool, String usageTip) {
        this.body = body;
        this.negativePrompt = negativePrompt;
        this.recommendedTool = recommendedTool;
        this.usageTip = usageTip;
    }

    public Long getId() {
        return id;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public String getBody() {
        return body;
    }

    public String getNegativePrompt() {
        return negativePrompt;
    }

    public String getRecommendedTool() {
        return recommendedTool;
    }

    public String getUsageTip() {
        return usageTip;
    }
}
