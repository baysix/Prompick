package com.prompick.report.domain;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BugReportRepository extends JpaRepository<BugReport, Long> {

    List<BugReport> findAllByOrderByIdDesc(Limit limit);

    List<BugReport> findByStatusOrderByIdDesc(BugReportStatus status, Limit limit);

    /** 내가 올린 신고. 올린 사람은 자기 것을 볼 수 있어야 답을 확인할 수 있다 */
    List<BugReport> findByUserIdOrderByIdDesc(Long userId, Limit limit);

    long countByStatus(BugReportStatus status);

    /** 같은 사람이 짧은 시간에 몇 건이나 올렸는지. 도배를 막는 데 쓴다 */
    long countByUserIdAndCreatedAtAfter(Long userId, Instant since);
}
