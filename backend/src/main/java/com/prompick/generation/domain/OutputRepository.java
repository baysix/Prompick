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

public interface OutputRepository extends JpaRepository<GenerationOutput, Long> {

    List<GenerationOutput> findByJobIdAndDeletedAtIsNull(Long jobId);

    @Query("""
            select o from GenerationOutput o
             where o.deletedAt is null and o.expiresAt < :now
            """)
    List<GenerationOutput> findExpired(@Param("now") Instant now, Limit limit);
}
