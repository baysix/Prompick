package com.prompick.request.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestVoteRepository extends JpaRepository<RequestVote, RequestVote.Key> {

    boolean existsByRequestIdAndUserId(Long requestId, Long userId);

    void deleteByRequestIdAndUserId(Long requestId, Long userId);

    /** 이 사람이 추천한 요청들. 목록에서 "이미 추천함"을 표시하려고 한 번에 가져온다 */
    List<RequestVote> findByUserIdAndRequestIdIn(Long userId, List<Long> requestIds);
}
