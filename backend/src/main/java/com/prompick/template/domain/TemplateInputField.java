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

    /**
     * 프롬프트의 {@code @이름}에서 만들어지는 사진 칸.
     *
     * <p>운영자가 따로 만들지 않는다. 지시문에 사진을 부르면 그 순간 필요한 칸이 정해지므로,
     * 같은 것을 두 군데에 적게 하면 어긋날 자리만 생긴다.
     */
    public static TemplateInputField photoFor(
            Long templateId, String fieldKey, String label, String helpText, int sortOrder) {

        TemplateInputField field = new TemplateInputField();
        field.templateId = templateId;
        field.fieldKey = fieldKey;
        field.fieldType = FieldType.IMAGE;
        field.label = label;
        field.helpText = helpText;
        field.required = true;
        field.options = List.of();
        field.validation = Map.of("minWidth", 200, "minHeight", 200);
        field.sortOrder = sortOrder;
        return field;
    }

    /** 설명만 고친다. 칸 자체는 그대로 두어 이미 만들어진 작업이 가리키는 이름이 살아 있게 한다 */
    public void describe(String label, String helpText, int sortOrder) {
        this.label = label;
        this.helpText = helpText;
        this.sortOrder = sortOrder;
    }

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
