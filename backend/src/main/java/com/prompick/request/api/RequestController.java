package com.prompick.request.api;

import com.prompick.request.app.RequestService;
import com.prompick.request.domain.TemplateRequest;
import com.prompick.template.domain.Template;
import com.prompick.template.domain.TemplateRepository;
import com.prompick.user.api.CurrentUser;
import com.prompick.user.app.UserService;
import com.prompick.user.domain.User;
import com.prompick.user.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * 요청 게시판.
 *
 * <p>목록은 로그인 없이 볼 수 있다. 무엇을 사람들이 원하는지는 이 서비스가 무엇인지 보여주는
 * 정보이기도 해서, 구경하러 온 사람에게 감춰둘 이유가 없다. 글을 올리거나 추천하는 것부터
 * 로그인이 필요하다.
 *
 * <p>작성자는 닉네임만 나간다. 이메일은 어떤 경우에도 내려보내지 않는다.
 */
@RestController
@RequestMapping("/api/v1/requests")
@Tag(name = "요청 게시판")
public class RequestController {

    private final RequestService service;
    private final UserRepository users;
    private final UserService userService;
    private final TemplateRepository templates;

    public RequestController(
            RequestService service,
            UserRepository users,
            UserService userService,
            TemplateRepository templates) {
        this.service = service;
        this.users = users;
        this.userService = userService;
        this.templates = templates;
    }

    @GetMapping
    @Operation(summary = "요청 목록", description = "로그인 없이 볼 수 있다. 기본은 추천 많은 순")
    public List<RequestResponse> list(
            @RequestParam(defaultValue = "VOTES") String sort,
            @RequestParam(defaultValue = "false") boolean onlyOpen,
            @RequestParam(defaultValue = "50") int size) {

        List<TemplateRequest> items = service.list(sort, onlyOpen, size);
        User me = currentUserOrNull();
        Set<Long> voted = service.votedIdsOf(me == null ? null : me.getId(), items);

        Map<Long, String> nicknames = nicknamesOf(items);
        Map<Long, String> templateSlugs = templateSlugsOf(items);

        return items.stream()
                .map(item -> toResponse(item, nicknames, templateSlugs, voted, me))
                .toList();
    }

    @PostMapping
    @Operation(summary = "요청 올리기", description = "만들고 싶은데 없는 스타일을 알려준다")
    public RequestResponse create(@CurrentUser User user, @Valid @RequestBody CreateRequest body) {
        TemplateRequest saved = service.create(
                user.getId(), body.title().trim(), body.referenceUrl(), body.description());

        return toResponse(saved, Map.of(user.getId(), user.getNickname()), Map.of(), Set.of(), user);
    }

    @PostMapping("/{id}/vote")
    @Operation(summary = "추천 누르기", description = "이미 눌렀으면 취소된다. 한 사람당 한 번")
    public VoteResponse vote(@CurrentUser User user, @PathVariable Long id) {
        boolean voted = service.toggleVote(id, user.getId());
        return new VoteResponse(voted);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "내 요청 지우기", description = "아직 접수 상태일 때만 지울 수 있다")
    public void delete(@CurrentUser User user, @PathVariable Long id) {
        service.delete(id, user.getId());
    }

    /**
     * 로그인했으면 사용자, 아니면 null.
     *
     * <p>{@code @CurrentUser}는 로그인하지 않았으면 예외를 던진다. 목록은 누구나 볼 수 있어야
     * 하므로 여기서는 직접 확인한다.
     */
    private User currentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return null;
        }
        try {
            return userService.resolve(
                    UUID.fromString(jwt.getSubject()), jwt.getClaimAsString("email"));
        } catch (RuntimeException e) {
            return null;
        }
    }

    private Map<Long, String> nicknamesOf(List<TemplateRequest> items) {
        Map<Long, String> result = new HashMap<>();
        items.stream()
                .map(TemplateRequest::getUserId)
                .distinct()
                .forEach(id -> users.findById(id)
                        .ifPresent(u -> result.put(id, u.getNickname())));
        return result;
    }

    /** 완성된 요청은 만들어진 템플릿으로 이어준다 */
    private Map<Long, String> templateSlugsOf(List<TemplateRequest> items) {
        Map<Long, String> result = new HashMap<>();
        items.stream()
                .map(TemplateRequest::getTemplateId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .forEach(id -> templates.findById(id).map(Template::getSlug)
                        .ifPresent(slug -> result.put(id, slug)));
        return result;
    }

    private RequestResponse toResponse(
            TemplateRequest item,
            Map<Long, String> nicknames,
            Map<Long, String> templateSlugs,
            Set<Long> voted,
            User me) {

        return new RequestResponse(
                item.getId(),
                item.getTitle(),
                item.getReferenceUrl(),
                item.getDescription(),
                item.getStatus().name(),
                item.getStatus().displayName(),
                item.getVoteCount(),
                voted.contains(item.getId()),
                nicknames.getOrDefault(item.getUserId(), "알 수 없음"),
                me != null && me.getId().equals(item.getUserId()),
                item.getTemplateId() == null ? null : templateSlugs.get(item.getTemplateId()),
                item.getAdminNote(),
                item.getCreatedAt());
    }

    public record CreateRequest(
            @NotBlank(message = "무엇을 만들고 싶은지 한 줄로 적어주세요")
                    @Size(max = 120, message = "제목은 120자까지예요")
                    String title,
            @Size(max = 500) String referenceUrl,
            @Size(max = 2000) String description) {}

    /**
     * @param votedByMe 내가 이미 추천했는지
     * @param mine 내가 올린 요청인지. 지우기 버튼을 보일지 정한다
     * @param templateSlug 완성됐다면 만들어진 템플릿 주소
     */
    public record RequestResponse(
            Long id,
            String title,
            String referenceUrl,
            String description,
            String status,
            String statusLabel,
            int voteCount,
            boolean votedByMe,
            String authorNickname,
            boolean mine,
            String templateSlug,
            String adminNote,
            Instant createdAt) {}

    public record VoteResponse(boolean voted) {}
}
