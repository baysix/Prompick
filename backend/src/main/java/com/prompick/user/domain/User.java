package com.prompick.user.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * 회원.
 *
 * <p>비밀번호는 여기 없다. 인증은 Supabase Auth가 맡고, 우리는 {@code authUserId}로 그 계정을 가리킨다.
 * 이 테이블에는 서비스 고유 정보(프롬비, 본인인증, 정지 상태)만 둔다.
 */
@Entity
@Table(name = "users")
public class User {

    public enum Role {
        USER,
        ADMIN
    }

    public enum Status {
        ACTIVE,
        SUSPENDED,
        WITHDRAWN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auth_user_id", nullable = false, unique = true)
    private UUID authUserId;

    @Column(length = 255)
    private String email;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status = Status.ACTIVE;

    @Column(name = "phone_verified_at")
    private Instant phoneVerifiedAt;

    @Column(name = "ci_hash", length = 128)
    private String ciHash;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected User() {}

    public User(UUID authUserId, String email, String nickname) {
        this.authUserId = authUserId;
        this.email = email;
        this.nickname = nickname;
    }

    public void touchLogin() {
        this.lastLoginAt = Instant.now();
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }

    /** 본인인증 완료. 같은 CI로는 한 계정만 무료 제작을 쓸 수 있다. */
    public void verifyIdentity(String ciHash) {
        this.ciHash = ciHash;
        this.phoneVerifiedAt = Instant.now();
    }

    public boolean isIdentityVerified() {
        return phoneVerifiedAt != null;
    }

    public boolean isActive() {
        return status == Status.ACTIVE;
    }

    public Long getId() {
        return id;
    }

    public UUID getAuthUserId() {
        return authUserId;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public Role getRole() {
        return role;
    }

    public Status getStatus() {
        return status;
    }

    /**
     * 계정을 멈추거나 되살린다.
     *
     * <p>탈퇴는 이 길로 하지 않는다. 탈퇴는 지워야 할 개인정보와 남겨야 할 거래 기록을 나누는
     * 별도의 절차라, 상태만 바꾸고 끝낼 일이 아니다.
     */
    public void changeStatus(Status status) {
        if (status == Status.WITHDRAWN) {
            throw new IllegalArgumentException("탈퇴는 이 방법으로 처리하지 않습니다");
        }
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
    }

    public Instant getPhoneVerifiedAt() {
        return phoneVerifiedAt;
    }
}
