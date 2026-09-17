package com.prompick.generation.domain;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FreeUsageRepository extends JpaRepository<FreeUsageDaily, FreeUsageDaily.Key> {

    /**
     * 오늘 무료 사용 횟수를 하나 올린다. 한도를 넘으면 아무것도 바꾸지 않는다.
     *
     * <p>확인과 증가를 하나의 SQL로 처리한다. 조회한 뒤 애플리케이션에서 판단하고 저장하면,
     * 동시에 들어온 두 요청이 같은 값을 읽어 한도를 넘길 수 있다.
     *
     * @return 1이면 차감 성공, 0이면 한도 초과
     */
    @Modifying
    @Query(
            value =
                    """
                    insert into free_usage_daily (user_id, usage_date, used_count)
                    values (:userId, :usageDate, 1)
                    on conflict (user_id, usage_date) do update
                       set used_count = free_usage_daily.used_count + 1
                     where free_usage_daily.used_count < :dailyLimit
                    """,
            nativeQuery = true)
    int tryConsume(
            @Param("userId") Long userId,
            @Param("usageDate") LocalDate usageDate,
            @Param("dailyLimit") int dailyLimit);

    /** 제작이 실패했을 때 횟수를 되돌린다. */
    @Modifying
    @Query(
            value =
                    """
                    update free_usage_daily
                       set used_count = used_count - 1
                     where user_id = :userId and usage_date = :usageDate and used_count > 0
                    """,
            nativeQuery = true)
    int restore(
            @Param("userId") Long userId, @Param("usageDate") LocalDate usageDate);
}
