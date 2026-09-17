package com.prompick.generation.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/**
 * 무료 제작 일일 사용량.
 *
 * <p>날짜는 KST 기준이다. 사용자에게 "오늘"은 한국 날짜이지, 서버의 UTC 날짜가 아니다.
 *
 * <p>증감은 이 엔티티가 아니라 저장소의 원자적 SQL로 처리한다. 조회 후 저장하는 방식으로는
 * 동시에 들어온 요청이 한도를 넘길 수 있다.
 */
@Entity
@Table(name = "free_usage_daily")
@IdClass(FreeUsageDaily.Key.class)
public class FreeUsageDaily {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "usage_date")
    private LocalDate usageDate;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    protected FreeUsageDaily() {}

    public Long getUserId() {
        return userId;
    }

    public LocalDate getUsageDate() {
        return usageDate;
    }

    public int getUsedCount() {
        return usedCount;
    }

    /** 복합키 */
    public static class Key implements Serializable {

        private Long userId;
        private LocalDate usageDate;

        public Key() {}

        public Key(Long userId, LocalDate usageDate) {
            this.userId = userId;
            this.usageDate = usageDate;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return Objects.equals(userId, key.userId) && Objects.equals(usageDate, key.usageDate);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, usageDate);
        }
    }
}
