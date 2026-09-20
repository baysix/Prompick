package com.prompick.credit.domain;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {

    List<CreditTransaction> findByUserIdOrderByIdDesc(Long userId, Pageable pageable);

    Page<CreditTransaction> findAllByOrderByIdDesc(Pageable pageable);

    @Query("""
            select coalesce(sum(t.amount), 0) from CreditTransaction t
             where t.reason = :reason and t.createdAt >= :from
            """)
    long sumByReasonSince(@Param("reason") CreditReason reason, @Param("from") Instant from);
}
