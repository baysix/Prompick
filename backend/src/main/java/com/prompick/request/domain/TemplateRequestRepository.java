package com.prompick.request.domain;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateRequestRepository extends JpaRepository<TemplateRequest, Long> {

    List<TemplateRequest> findByStatusInOrderByVoteCountDescIdDesc(
            List<RequestStatus> statuses, Pageable pageable);

    List<TemplateRequest> findAllByOrderByIdDesc(Pageable pageable);

    List<TemplateRequest> findByStatusOrderByVoteCountDescIdDesc(
            RequestStatus status, Pageable pageable);

    /** 한 사람이 열어둔 요청 수. 너무 많이 올리는 것을 막는 데 쓴다 */
    long countByUserIdAndStatus(Long userId, RequestStatus status);
}
