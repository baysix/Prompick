package com.prompick.ai.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 제공사 API 키.
 *
 * <p>값은 항상 봉인된 상태로 들고 있다. 이 객체는 원문을 알지 못하고, 알 필요도 없다. 원문이 필요한
 * 곳은 실제로 호출을 보내는 순간뿐이다.
 *
 * <p>게터에 원문을 돌려주는 메서드를 만들지 않는다. 있으면 언젠가 DTO에 실려 나간다.
 */
@Entity
@Table(name = "provider_credentials")
public class ProviderCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, unique = true)
    private Provider provider;

    @Column(name = "encrypted_value", nullable = false, columnDefinition = "text")
    private String encryptedValue;

    @Column(name = "key_hint", nullable = false, length = 20)
    private String keyHint;

    @Column(nullable = false)
    private boolean active = true;

    @Column(columnDefinition = "text")
    private String memo;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected ProviderCredential() {}

    public ProviderCredential(
            Provider provider, String encryptedValue, String keyHint, String memo, String updatedBy) {
        this.provider = provider;
        this.encryptedValue = encryptedValue;
        this.keyHint = keyHint;
        this.memo = memo;
        this.updatedBy = updatedBy;
    }

    /** 새 키로 갈아 끼운다. 이전 값은 남기지 않는다 */
    public void replace(String encryptedValue, String keyHint, String memo, String updatedBy) {
        this.encryptedValue = encryptedValue;
        this.keyHint = keyHint;
        this.memo = memo;
        this.updatedBy = updatedBy;
        this.active = true;
        this.updatedAt = Instant.now();
    }

    /**
     * 키를 지우지 않고 잠시 막는다.
     *
     * <p>한도가 찼거나 요금이 튀었을 때 급히 끄는 자리다. 지워버리면 다시 발급받아야 한다.
     */
    public void setActive(boolean active, String updatedBy) {
        this.active = active;
        this.updatedBy = updatedBy;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Provider getProvider() {
        return provider;
    }

    /** 봉인된 값. 이대로는 쓸 수 없고 SecretCipher를 거쳐야 한다 */
    public String getEncryptedValue() {
        return encryptedValue;
    }

    public String getKeyHint() {
        return keyHint;
    }

    public boolean isActive() {
        return active;
    }

    public String getMemo() {
        return memo;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
