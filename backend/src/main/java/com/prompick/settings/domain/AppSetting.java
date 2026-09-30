package com.prompick.settings.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 운영 설정값 한 줄.
 *
 * <p>배포하지 않고 바꿔야 하는 값을 담는다. application.yml 의 값은 기본값이고, 여기에 값이
 * 있으면 그쪽이 우선한다.
 *
 * <p><b>값의 모양은 키마다 다르다.</b> 어떤 키는 숫자고 어떤 키는 객체다. 그래서 이 엔티티를
 * 통째로 훑는 조회({@code findAll})를 하면 안 된다 — 모양이 다른 값을 한 가지로 읽으려다
 * 깨진다. 반드시 키를 알고 하나씩 꺼내고, 꺼낸 값을 해석하는 일은 그 키를 아는 서비스가 한다.
 * 화면이나 컨트롤러가 이 Map 을 직접 들여다보지 않게 하려는 규칙이다.
 */
@Entity
@Table(name = "app_settings")
public class AppSetting {

    @Id
    @Column(name = "setting_key", nullable = false, length = 100)
    private String key;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "value", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> value = new LinkedHashMap<>();

    @Column(name = "description", length = 500)
    private String description;

    /** 마지막으로 바꾼 관리자. 운영 설정은 누가 건드렸는지가 곧 사고 원인이 된다 */
    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected AppSetting() {}

    /** 값을 통째로 갈아 끼운다. 부분 수정은 하지 않는다 — 어떤 키가 사라졌는지 추적하기 어렵다. */
    public void replace(Map<String, Object> newValue, Long adminId) {
        this.value = new LinkedHashMap<>(newValue);
        this.updatedBy = adminId;
        this.updatedAt = Instant.now();
    }

    public String getKey() {
        return key;
    }

    public Map<String, Object> getValue() {
        return value;
    }

    public String getDescription() {
        return description;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
