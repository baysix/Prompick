package com.prompick.admin.api;

import com.prompick.ai.app.ProviderCredentialService;
import com.prompick.ai.domain.Provider;
import com.prompick.ai.domain.ProviderCredential;
import com.prompick.ai.provider.GenerationProvider;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 제공사 키 관리.
 *
 * <p>이 컨트롤러는 키 원문을 절대 내려보내지 않는다. 넣을 수만 있고 꺼낼 수는 없다. 관리자조차
 * 한 번 넣은 키를 다시 볼 수 없고, 잊어버렸으면 제공사에서 새로 발급받아 덮어써야 한다.
 *
 * <p>불편해 보이지만 이게 맞다. 꺼낼 수 있게 만들면 그 경로 하나 때문에 화면·로그·브라우저 기록
 * 어디에든 키가 남을 수 있다. 끝 네 자리만 보여주면 어느 키를 넣어뒀는지 확인하기에 충분하다.
 */
@RestController
@RequestMapping("/api/v1/admin/provider-keys")
@Tag(name = "관리자 - 제공사 키")
public class AdminProviderKeyController {

    private final ProviderCredentialService credentials;
    private final Map<Provider, GenerationProvider> providers;

    public AdminProviderKeyController(
            ProviderCredentialService credentials, List<GenerationProvider> providerList) {
        this.credentials = credentials;
        this.providers = providerList.stream()
                .collect(Collectors.toMap(GenerationProvider::type, Function.identity()));
    }

    @PostMapping("/{provider}/test")
    @Operation(
            summary = "연결 확인",
            description = "키가 살아 있는지 확인하고 쓸 수 있는 모델 이름을 돌려준다. 요금이 붙지 않는다")
    public GenerationProvider.ProviderCheck test(@PathVariable Provider provider) {
        GenerationProvider adapter = providers.get(provider);
        if (adapter == null) {
            return new GenerationProvider.ProviderCheck(
                    false, "아직 연동되지 않은 제공사예요", List.of());
        }
        return adapter.check();
    }

    @GetMapping
    @Operation(summary = "제공사별 키 상태", description = "키 원문은 포함하지 않는다. 끝 네 자리만 내려간다")
    public KeyListResponse list() {
        Map<Provider, ProviderCredential> stored = credentials.findAll().stream()
                .collect(Collectors.toMap(ProviderCredential::getProvider, Function.identity()));

        List<KeyResponse> items = java.util.Arrays.stream(Provider.values())
                .filter(Provider::needsApiKey)
                .map(provider -> toResponse(provider, stored.get(provider)))
                .toList();

        return new KeyListResponse(items, credentials.canStore());
    }

    @PutMapping("/{provider}")
    @Operation(summary = "키 넣기", description = "이미 있으면 갈아 끼운다. 이전 키는 남기지 않는다")
    public KeyResponse save(
            @PathVariable Provider provider,
            @Valid @RequestBody SaveRequest request,
            Authentication authentication) {

        if (!credentials.canStore()) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR);
        }
        try {
            ProviderCredential saved = credentials.save(
                    provider, request.apiKey(), request.memo(), actorOf(authentication));
            return toResponse(provider, saved);

        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
    }

    @PatchMapping("/{provider}")
    @Operation(summary = "키 켜고 끄기", description = "지우지 않고 잠시 막을 때")
    public KeyResponse setActive(
            @PathVariable Provider provider,
            @RequestBody ActiveRequest request,
            Authentication authentication) {

        try {
            ProviderCredential saved =
                    credentials.setActive(provider, request.active(), actorOf(authentication));
            return toResponse(provider, saved);

        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
    }

    @DeleteMapping("/{provider}")
    @Operation(summary = "키 삭제")
    public KeyResponse delete(@PathVariable Provider provider) {
        credentials.delete(provider);
        return toResponse(provider, null);
    }

    private KeyResponse toResponse(Provider provider, ProviderCredential credential) {
        boolean fromEnv = credential == null && credentials.hasEnvKey(provider);

        return new KeyResponse(
                provider.name(),
                provider.displayName(),
                credential != null,
                fromEnv,
                credential != null ? credential.getKeyHint() : fromEnv ? "설정 파일" : null,
                credential == null || credential.isActive(),
                credential != null ? credential.getMemo() : null,
                credential != null ? credential.getUpdatedBy() : null,
                credential != null ? credential.getUpdatedAt() : null);
    }

    /** 누가 바꿨는지. 토큰의 subject를 그대로 쓴다 */
    private static String actorOf(Authentication authentication) {
        return authentication == null ? "unknown" : authentication.getName();
    }

    public record SaveRequest(
            @NotBlank @Size(max = 500) String apiKey,
            @Size(max = 300) String memo) {}

    public record ActiveRequest(boolean active) {}

    /**
     * @param stored DB에 봉인해 둔 키가 있는지
     * @param fromEnv 설정 파일(.env)에만 있는지
     * @param keyHint 끝 네 자리. 원문이 아니다
     */
    public record KeyResponse(
            String provider,
            String displayName,
            boolean stored,
            boolean fromEnv,
            String keyHint,
            boolean active,
            String memo,
            String updatedBy,
            Instant updatedAt) {}

    /**
     * @param canStore 마스터 키가 있어서 화면에서 키를 저장할 수 있는 상태인지
     */
    public record KeyListResponse(List<KeyResponse> items, boolean canStore) {}
}
