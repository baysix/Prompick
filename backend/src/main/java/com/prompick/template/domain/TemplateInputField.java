package com.prompick.template.domain;

import jakarta.persistence.*;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 사용자가 채우는 입력 필드. 만들기 화면이 이 정의대로 렌더링된다. */
@Entity
@Table(name = "template_input_fields")
public class TemplateInputField {

    public enum FieldType {
        IMAGE,
        SELECT,
        TEXT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    /** 파이프라인이 참조하는 키 (예: product_photo) */
    @Column(name = "field_key", nullable = false, length = 50)
    private String fieldKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false, length = 20)
    private FieldType fieldType;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "help_text", length = 300)
    private String helpText;

    @Column(nullable = false)
    private boolean required = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> options = List.of();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> validation = Map.of();

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected TemplateInputField() {}

    public Long getId() {
        return id;
    }

    public String getFieldKey() {
        return fieldKey;
    }

    public FieldType getFieldType() {
        return fieldType;
    }

    public String getLabel() {
        return label;
    }

    public String getHelpText() {
        return helpText;
    }

    public boolean isRequired() {
        return required;
    }

    public List<Map<String, Object>> getOptions() {
        return options;
    }

    public Map<String, Object> getValidation() {
        return validation;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
