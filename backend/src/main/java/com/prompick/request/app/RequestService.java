package com.prompick.request.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.request.domain.*;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 요청 게시판.
 *
 * <p>추천 수는 요청 행에 들고 있고 투표는 따로 있다. 둘이 어긋나면 만들 순서를 정하는 근거가
 * 무너지므로, 세는 일과 표를 넣는 일을 항상 같은 트랜잭션에서 한다.
 */
@Service
public class RequestService {

    /** 한 사람이 동시에 열어둘 수 있는 요청 수. 게시판이 한 사람 것으로 뒤덮이는 것을 막는다 */
    private static final int MAX_OPEN_PER_USER = 5;

    private final TemplateRequestRepository requests;
    private final RequestVoteRepository votes;

    public RequestService(TemplateRequestRepository requests, RequestVoteRepository votes) {
        this.requests = requests;
        this.votes = votes;
    }

    /**
     * 목록.
     *
     * @param sort "VOTES"면 추천순, 아니면 최신순
     * @param onlyOpen 아직 끝나지 않은 것만
     */
    @Transactional(readOnly = true)
    public List<TemplateRequest> list(String sort, boolean onlyOpen, int size) {
        var page = PageRequest.of(0, Math.min(size, 100));

        if (onlyOpen) {
            return requests.findByStatusInOrderByVoteCountDescIdDesc(
                    List.of(RequestStatus.PENDING, RequestStatus.REVIEWING, RequestStatus.BUILDING),
                    page);
        }
        if ("VOTES".equalsIgnoreCase(sort)) {
            return requests.findAll(page).getContent().stream()
                    .sorted((a, b) -> {
                        int byVotes = Integer.compare(b.getVoteCount(), a.getVoteCount());
                        return byVotes != 0 ? byVotes : Long.compare(b.getId(), a.getId());
                    })
                    .toList();
        }
        return requests.findAllByOrderByIdDesc(page);
    }

    /** 이 사람이 이미 추천한 요청들. 목록에 한 번에 표시하려고 모아서 가져온다 */
    @Transactional(readOnly = true)
    public Set<Long> votedIdsOf(Long userId, List<TemplateRequest> items) {
        if (userId == null || items.isEmpty()) {
            return Set.of();
        }
        List<Long> ids = items.stream().map(TemplateRequest::getId).toList();
        return votes.findByUserIdAndRequestIdIn(userId, ids).stream()
                .map(RequestVote::getRequestId)
                .collect(Collectors.toSet());
    }

    @Transactional
    public TemplateRequest create(
            Long userId, String title, String referenceUrl, String description) {

        long open = requests.countByUserIdAndStatus(userId, RequestStatus.PENDING);
        if (open >= MAX_OPEN_PER_USER) {
            throw new ApiException(
                    ErrorCode.INVALID_REQUEST,
                    "아직 접수 중인 요청이 %d개 있어요. 그것부터 처리되면 다시 올려주세요".formatted(open));
        }
        return requests.save(new TemplateRequest(userId, title, blankToNull(referenceUrl), description));
    }

    /**
     * 추천을 누르거나 취소한다.
     *
     * @return 누른 뒤의 상태 (추천했으면 true)
     */
    @Transactional
    public boolean toggleVote(Long requestId, Long userId) {
        TemplateRequest request = requests
                .findById(requestId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (votes.existsByRequestIdAndUserId(requestId, userId)) {
            votes.deleteByRequestIdAndUserId(requestId, userId);
            request.addVote(-1);
            requests.save(request);
            return false;
        }

        votes.save(new RequestVote(requestId, userId));
        request.addVote(1);
        requests.save(request);
        return true;
    }

    @Transactional
    public void delete(Long requestId, Long userId) {
        TemplateRequest request = requests
                .findById(requestId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (!request.isDeletableBy(userId)) {
            // 이미 만들기 시작한 요청은 지울 수 없다. 다른 사람이 추천해 둔 것이기도 하다.
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        requests.delete(request);
    }

    /* --- 관리자 --- */

    @Transactional(readOnly = true)
    public List<TemplateRequest> forAdmin(RequestStatus status, int size) {
        var page = PageRequest.of(0, Math.min(size, 200));
        return status == null
                ? requests.findAllByOrderByIdDesc(page)
                : requests.findByStatusOrderByVoteCountDescIdDesc(status, page);
    }

    @Transactional
    public TemplateRequest changeStatus(
            Long requestId, RequestStatus next, Long templateId, String adminNote) {

        TemplateRequest request = requests
                .findById(requestId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        try {
            request.moveTo(next, templateId, adminNote);
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, e.getMessage());
        }
        return requests.save(request);
    }

    /** 요청 올린 사람들의 닉네임. 목록마다 사용자 표를 다시 뒤지지 않도록 한 번에 모은다 */
    @Transactional(readOnly = true)
    public Map<Long, String> nicknamesOf(
            List<TemplateRequest> items, Function<List<Long>, Map<Long, String>> loader) {
        List<Long> userIds = items.stream().map(TemplateRequest::getUserId).distinct().toList();
        return userIds.isEmpty() ? Map.of() : loader.apply(userIds);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
