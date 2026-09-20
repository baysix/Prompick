package com.prompick.admin.api;

import com.prompick.request.app.RequestService;
import com.prompick.request.domain.RequestStatus;
import com.prompick.request.domain.TemplateRequest;
import com.prompick.template.domain.TemplateRepository;
import com.prompick.user.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

/**
 * 요청 관리.
 *
 * <p>운영자에게 이 화면은 "다음에 무엇을 만들까"의 답이다. 추천 많은 순으로 보면 사람들이
 * 실제로 기다리는 것이 위로 올라온다. 감으로 정하지 않게 해주는 것이 이 화면의 값어치다.
 *
 * <p>상태를 바꿀 때 완성이면 템플릿을, 반려면 이유를 반드시 받는다. 아무 말 없이 닫히는 요청이
 * 쌓이면 다음부터 아무도 올리지 않는다.
 */
@RestController
@RequestMapping("/api/v1/admin/requests")
@Tag(name = "관리자 - 요청")
public class AdminRequestController {

    private final RequestService service;
    private final UserRepository users;
    private final TemplateRepository templates;

    public AdminRequestController(
            RequestService service, UserRepository users, TemplateRepository templates) {
        this.service = service;
        this.users = users;
        this.templates = templates;
    }

    @GetMapping
    @Operation(summary = "요청 목록", description = "상태를 주면 그것만. 기본은 전체를 최신순으로")
    public List<AdminRequestRow> list(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(defaultValue = "100") int size) {

        List<TemplateRequest> items = service.forAdmin(status, size);

        Map<Long, String> nicknames = new HashMap<>();
        items.stream().map(TemplateRequest::getUserId).distinct()
                .forEach(id -> users.findById(id).ifPresent(u -> nicknames.put(id, u.getNickname())));

        Map<Long, String> slugs = new HashMap<>();
        templates.findAll().forEach(t -> slugs.put(t.getId(), t.getSlug()));

        return items.stream()
                .map(item -> new AdminRequestRow(
                        item.getId(),
                        item.getTitle(),
                        item.getReferenceUrl(),
                        item.getDescription(),
                        item.getStatus().name(),
                        item.getStatus().displayName(),
                        item.getVoteCount(),
                        nicknames.getOrDefault(item.getUserId(), "알 수 없음"),
                        item.getTemplateId(),
                        item.getTemplateId() == null ? null : slugs.get(item.getTemplateId()),
                        item.getAdminNote(),
                        item.getCreatedAt()))
                .toList();
    }

    @GetMapping("/templates")
    @Operation(summary = "이어줄 템플릿 후보", description = "완성 처리할 때 고를 목록")
    public List<TemplateOption> templateOptions() {
        return templates.findAll().stream()
                .map(t -> new TemplateOption(t.getId(), t.getTitle(), t.getSlug()))
                .toList();
    }

    @PatchMapping("/{id}")
    @Operation(
            summary = "상태 바꾸기",
            description = "완성이면 템플릿을, 반려면 이유를 함께 보낸다")
    public AdminRequestRow changeStatus(
            @PathVariable Long id, @RequestBody StatusRequest request) {

        service.changeStatus(id, request.status(), request.templateId(), request.adminNote());

        return list(null, 200).stream()
                .filter(row -> row.id().equals(id))
                .findFirst()
                .orElseThrow();
    }

    public record StatusRequest(RequestStatus status, Long templateId, String adminNote) {}

    public record TemplateOption(Long id, String title, String slug) {}

    public record AdminRequestRow(
            Long id,
            String title,
            String referenceUrl,
            String description,
            String status,
            String statusLabel,
            int voteCount,
            String authorNickname,
            Long templateId,
            String templateSlug,
            String adminNote,
            Instant createdAt) {}
}
