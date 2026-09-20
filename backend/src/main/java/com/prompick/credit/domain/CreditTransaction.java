package com.prompick.credit.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 프롬비 거래 한 줄.
 *
 * <p>한 번 쓰면 고치지 않는다. 그래서 수정용 메서드가 하나도 없다. 잘못 넣었으면 반대 방향
 * 거래를 한 줄 더 넣어 바로잡는다 — 회계 장부와 같은 원칙이다.
 */
@Entity
@Table(name = "credit_transactions")
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 양수는 늘어난 것, 음수는 줄어든 것 */
    @Column(nullable = false)
    private int amount;

    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CreditReason reason;

    @Column(name = "ref_type", length = 30)
    private String refType;

    @Column(name = "ref_id")
    private Long refId;

    @Column(length = 100)
    private String actor;

    @Column(columnDefinition = "text")
    private String memo;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected CreditTransaction() {}

    public CreditTransaction(
            Long userId,
            int amount,
            int balanceAfter,
            CreditReason reason,
            String refType,
            Long refId,
            String actor,
            String memo) {
        this.userId = userId;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.reason = reason;
        this.refType = refType;
        this.refId = refId;
        this.actor = actor;
        this.memo = memo;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public int getAmount() {
        return amount;
    }

    public int getBalanceAfter() {
        return balanceAfter;
    }

    public CreditReason getReason() {
        return reason;
    }

    public String getRefType() {
        return refType;
    }

    public Long getRefId() {
        return refId;
    }

    public String getActor() {
        return actor;
    }

    public String getMemo() {
        return memo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
