package com.prompick.credit.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 프롬비 지갑.
 *
 * <p>잔액을 직접 세팅하는 메서드를 두지 않는다. 늘리고 줄이는 것만 가능하고, 그때마다 거래가
 * 함께 기록되도록 서비스가 강제한다. 잔액만 조용히 고칠 수 있는 길을 열어두면 언젠가 누군가
 * 그 길로 고치고, 그 뒤로는 장부를 믿을 수 없게 된다.
 */
@Entity
@Table(name = "credit_accounts")
public class CreditAccount {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private int balance;

    @Column(name = "total_charged", nullable = false)
    private int totalCharged;

    @Column(name = "total_spent", nullable = false)
    private int totalSpent;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected CreditAccount() {}

    public CreditAccount(Long userId) {
        this.userId = userId;
    }

    /**
     * 잔액을 바꾼다.
     *
     * <p><b>CreditService 말고는 부르지 않는다.</b> 이 메서드는 거래를 남기지 않기 때문에,
     * 여기만 따로 부르면 잔액과 장부가 어긋난다. 자바에서 패키지를 넘어 접근을 막을 방법이
     * 없어 public으로 열려 있을 뿐이다.
     *
     * @param amount 양수면 늘리고 음수면 줄인다
     * @return 바뀐 뒤의 잔액
     * @throws IllegalStateException 잔액보다 많이 빼려 할 때
     */
    public int apply(int amount) {
        if (balance + amount < 0) {
            throw new IllegalStateException("잔액이 부족합니다");
        }
        balance += amount;

        if (amount > 0) {
            totalCharged += amount;
        } else {
            totalSpent += -amount;
        }
        updatedAt = Instant.now();
        return balance;
    }

    public Long getUserId() {
        return userId;
    }

    public int getBalance() {
        return balance;
    }

    public int getTotalCharged() {
        return totalCharged;
    }

    public int getTotalSpent() {
        return totalSpent;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
