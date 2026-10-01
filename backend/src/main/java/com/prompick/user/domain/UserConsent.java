package com.prompick.user.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 동의 한 건.
 *
 * <p>한 줄이 "사건" 하나다. 사용자가 동의하면 한 줄, 철회하면 {@code agreed=false}로 또 한 줄이
 * 쌓인다. 기존 줄을 고치지 않는 이유는, 고치는 순간 "그때 동의했다"는 사실 자체가 사라지기
 * 때문이다. 지금 상태를 묻는 쪽이 가장 최근 줄을 보면 된다.
 *
 * <p>그래서 이 객체에는 상태를 바꾸는 메서드가 없다. 만들고 저장할 뿐이다.
 */
@Entity
@Table(name = "user_consents")
public class UserConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 20)
    private ConsentKind kind;

    /** 동의 당시 보여준 문서의 버전. 무엇에 동의했는지 되짚기 위해 남긴다 */
    @Column(name = "version", nullable = false, length = 20)
    private String version;

    @Column(name = "agreed", nullable = false)
    private boolean agreed;

    @Column(name = "agreed_at", nullable = false)
    private Instant agreedAt = Instant.now();

    protected UserConsent() {}

    public UserConsent(Long userId, ConsentKind kind, String version, boolean agreed) {
        this.userId = userId;
        this.kind = kind;
        this.version = version;
        this.agreed = agreed;
        this.agreedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public ConsentKind getKind() {
        return kind;
    }

    public String getVersion() {
        return version;
    }

    public boolean isAgreed() {
        return agreed;
    }

    public Instant getAgreedAt() {
        return agreedAt;
    }
}
