package com.prompick.ai.domain;

import jakarta.persistence.*;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 외부 AI 모델. 관리자 전용.
 *
 * <p>템플릿마다 쓰는 모델이 다르지만 사용자에게는 보이지 않는다. 관리자가 파이프라인 단계마다 고른다.
 */
@Entity
@Table(name = "ai_models")
public class AiModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Provider provider;

    @Column(name = "model_key", nullable = false, length = 100)
    private String modelKey;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Capability capability;

    /** 1회 호출 원가(원). 마진 계산용 */
    @Column(name = "unit_cost_krw", nullable = false)
    private int unitCostKrw;

    /** 모델이 받는 파라미터 정의. 관리자 화면이 이걸로 입력 폼을 그린다 */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "param_schema", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> paramSchema = Map.of();

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(columnDefinition = "text")
    private String memo;

    protected AiModel() {}

    public Long getId() {
        return id;
    }

    public Provider getProvider() {
        return provider;
    }

    public String getModelKey() {
        return modelKey;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Capability getCapability() {
        return capability;
    }

    public int getUnitCostKrw() {
        return unitCostKrw;
    }

    public Map<String, Object> getParamSchema() {
        return paramSchema;
    }

    public boolean isActive() {
        return active;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public String getMemo() {
        return memo;
    }
}
