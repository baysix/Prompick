package com.prompick.ai.app;

import com.prompick.ai.domain.Provider;
import com.prompick.ai.domain.ProviderCredential;
import com.prompick.ai.domain.ProviderCredentialRepository;
import com.prompick.common.crypto.SecretCipher;
import com.prompick.config.PrompickProperties;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 제공사 키를 꺼내고 갈아 끼운다.
 *
 * <p>키가 있는 곳은 두 군데다. 관리자 화면에서 넣어 DB에 봉인해 둔 것과, 환경변수에 직접 넣은 것.
 * 화면 쪽이 항상 이긴다. 운영 중에 바꾸는 쪽이 화면이기 때문이다. 환경변수는 화면에 아직 아무것도
 * 넣지 않았을 때(첫 배포, 로컬 개발)를 위한 대비책이다.
 *
 * <p>원문을 돌려주는 메서드는 {@link #keyFor} 하나뿐이고, 호출하는 곳은 제공사 어댑터뿐이다.
 * 키를 로그에 남기지 않는 것은 물론, 예외 메시지에도 싣지 않는다.
 */
@Service
public class ProviderCredentialService {

    private static final Logger log = LoggerFactory.getLogger(ProviderCredentialService.class);

    private final ProviderCredentialRepository repository;
    private final SecretCipher cipher;
    private final Map<String, String> envKeys;

    public ProviderCredentialService(
            ProviderCredentialRepository repository,
            SecretCipher cipher,
            PrompickProperties properties) {
        this.repository = repository;
        this.cipher = cipher;
        this.envKeys = properties.ai().keys() == null ? Map.of() : properties.ai().keys();
    }

    /**
     * 호출에 쓸 키를 꺼낸다.
     *
     * @return 키가 없거나 꺼져 있으면 비어 있음
     */
    @Transactional(readOnly = true)
    public Optional<String> keyFor(Provider provider) {
        Optional<ProviderCredential> stored = repository.findByProvider(provider);

        if (stored.isPresent() && stored.get().isActive()) {
            try {
                return Optional.of(cipher.open(stored.get().getEncryptedValue()));
            } catch (RuntimeException e) {
                // 마스터 키가 바뀌었을 때 여기로 온다. 조용히 환경변수로 넘어가면 원인을 못 찾는다.
                log.error("{} 키를 복호화하지 못했습니다. 마스터 키를 확인해주세요", provider);
                return Optional.empty();
            }
        }

        // 화면에 넣은 게 없으면 환경변수를 본다.
        String fromEnv = envKeys.get(provider.name());
        return fromEnv == null || fromEnv.isBlank() ? Optional.empty() : Optional.of(fromEnv);
    }

    /** 키가 하나라도 준비되어 있는지. 원문은 건드리지 않는다 */
    @Transactional(readOnly = true)
    public boolean hasKey(Provider provider) {
        return keyFor(provider).isPresent();
    }

    @Transactional(readOnly = true)
    public List<ProviderCredential> findAll() {
        return repository.findAllByOrderByProviderAsc();
    }

    /** 환경변수에만 키가 있는 제공사인지. 화면에서 "파일에 있음"으로 구분해 보여준다 */
    public boolean hasEnvKey(Provider provider) {
        String fromEnv = envKeys.get(provider.name());
        return fromEnv != null && !fromEnv.isBlank();
    }

    /**
     * 키를 넣거나 갈아 끼운다.
     *
     * <p>이전 키는 남기지 않는다. 지난 키를 보관하면 그것도 지켜야 할 비밀이 하나 더 느는 것인데,
     * 되돌릴 일이 생기면 제공사에서 다시 발급받는 편이 안전하다.
     */
    @Transactional
    public ProviderCredential save(Provider provider, String rawKey, String memo, String actor) {
        if (!provider.needsApiKey()) {
            throw new IllegalArgumentException(provider.displayName() + "는 API 키가 필요 없습니다");
        }

        String trimmed = rawKey.trim();
        String sealed = cipher.seal(trimmed);
        String hint = SecretCipher.hint(trimmed);

        ProviderCredential credential = repository.findByProvider(provider)
                .map(existing -> {
                    existing.replace(sealed, hint, memo, actor);
                    return existing;
                })
                .orElseGet(() -> new ProviderCredential(provider, sealed, hint, memo, actor));

        // 키 자체는 남기지 않고 바뀌었다는 사실만 남긴다.
        log.info("{} 키가 갱신되었습니다 (by {})", provider, actor);
        return repository.save(credential);
    }

    @Transactional
    public ProviderCredential setActive(Provider provider, boolean active, String actor) {
        ProviderCredential credential = repository.findByProvider(provider)
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 제공사입니다"));

        credential.setActive(active, actor);
        log.info("{} 키를 {} 했습니다 (by {})", provider, active ? "사용" : "중지", actor);
        return repository.save(credential);
    }

    @Transactional
    public void delete(Provider provider) {
        repository.findByProvider(provider).ifPresent(credential -> {
            repository.delete(credential);
            log.info("{} 키를 삭제했습니다", provider);
        });
    }

    public boolean canStore() {
        return cipher.isReady();
    }
}
