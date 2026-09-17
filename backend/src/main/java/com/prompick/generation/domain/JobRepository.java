package com.prompick.generation.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobRepository extends JpaRepository<GenerationJob, Long> {

    Optional<GenerationJob> findByUserIdAndIdempotencyKey(Long userId, String idempotencyKey);

    Optional<GenerationJob> findByIdAndUserId(Long id, Long userId);

    List<GenerationJob> findByUserIdOrderByIdDesc(Long userId, Limit limit);

    List<GenerationJob> findByUserIdAndStatusOrderByIdDesc(
            Long userId, JobStatus status, Limit limit);

    /**
     * 워커가 집어갈 작업을 찾는다.
     *
     * <p>{@code FOR UPDATE SKIP LOCKED}로 잠근다. 여러 워커가 동시에 조회해도 서로 다른 작업을
     * 가져가고, 이미 잠긴 행을 기다리지 않는다.
     *
     * <p>lockedUntil이 지난 작업도 대상에 넣는다. 워커가 죽어서 놓친 작업을 다른 워커가 이어받는다.
     *
     * <p>잠금은 SQL의 {@code for update skip locked}가 직접 건다. 여기에 @Lock 애노테이션을
     * 함께 쓰면 "네이티브 쿼리에 잠금 모드를 지정할 수 없다"는 오류가 난다.
     */
    @Query(
            value =
                    """
                    select * from generation_jobs
                     where (status = 'QUEUED' and (locked_until is null or locked_until < now()))
                        or (status = 'RUNNING' and locked_until < now())
                     order by id
                     limit :limit
                     for update skip locked
                    """,
            nativeQuery = true)
    List<GenerationJob> pickUp(@Param("limit") int limit);

    /** 제한 시간을 넘긴 작업. 영원히 진행 중으로 남지 않게 한다. */
    @Query("""
            select j from GenerationJob j
             where j.status = com.prompick.generation.domain.JobStatus.RUNNING
               and j.startedAt < :threshold
            """)
    List<GenerationJob> findStuck(@Param("threshold") Instant threshold);
}
