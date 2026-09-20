package com.prompick.common.crypto;

import com.prompick.config.PrompickProperties;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 저장할 비밀값을 봉인한다.
 *
 * <p>AES-256-GCM을 쓴다. GCM은 암호화와 동시에 위조 검사를 한다. 누군가 DB에서 암호문을 한 글자라도
 * 바꾸면 복호화가 조용히 이상한 값을 내놓는 대신 실패한다. 키처럼 "틀리면 바로 알아야 하는" 값에는
 * 이 성질이 중요하다.
 *
 * <p>마스터 키는 환경변수에만 둔다. DB에 함께 두면 봉투와 열쇠를 같은 서랍에 넣는 셈이라 암호화한
 * 의미가 사라진다. 키가 없으면 저장 자체를 거절한다 — 평문으로 대신 넣어주는 편의는 두지 않는다.
 * 그 편의가 있으면 언젠가 누군가는 평문으로 운영한다.
 */
@Component
public class SecretCipher {

    private static final Logger log = LoggerFactory.getLogger(SecretCipher.class);

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecretKeySpec masterKey;
    private final SecureRandom random = new SecureRandom();

    public SecretCipher(PrompickProperties properties) {
        this.masterKey = parse(properties.ai().masterKey());

        if (masterKey == null) {
            log.warn("PROMPICK_MASTER_KEY가 없습니다. 관리자 화면에서 제공사 키를 저장할 수 없고, "
                    + "환경변수에 직접 넣은 키만 동작합니다");
        }
    }

    public boolean isReady() {
        return masterKey != null;
    }

    /** 봉인한다. 결과는 base64(iv + 암호문) */
    public String seal(String plaintext) {
        requireReady();
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, new GCMParameterSpec(TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);

        } catch (Exception e) {
            // 예외 메시지에 평문이 섞여 나갈 수 있으므로 원인을 달지 않는다.
            throw new IllegalStateException("비밀값을 암호화하지 못했습니다");
        }
    }

    /** 봉인을 푼다. 위조되었거나 다른 마스터 키로 만든 값이면 실패한다 */
    public String open(String sealed) {
        requireReady();
        try {
            byte[] combined = Base64.getDecoder().decode(sealed);

            byte[] iv = new byte[IV_BYTES];
            System.arraycopy(combined, 0, iv, 0, IV_BYTES);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, new GCMParameterSpec(TAG_BITS, iv));

            byte[] decrypted = cipher.doFinal(combined, IV_BYTES, combined.length - IV_BYTES);
            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new IllegalStateException(
                    "비밀값을 복호화하지 못했습니다. 마스터 키가 바뀌었는지 확인해주세요");
        }
    }

    /**
     * 화면에 보여줄 끝자리.
     *
     * <p>앞자리는 보여주지 않는다. 제공사마다 접두사가 정해져 있어서(sk-, sk-ant- 등) 앞을 보여주면
     * 실제로 가려지는 글자가 몇 개 안 된다.
     */
    public static String hint(String plaintext) {
        if (plaintext == null || plaintext.length() < 4) {
            return "····";
        }
        return "····" + plaintext.substring(plaintext.length() - 4);
    }

    private void requireReady() {
        if (masterKey == null) {
            throw new IllegalStateException(
                    "PROMPICK_MASTER_KEY가 설정되지 않아 키를 저장할 수 없습니다");
        }
    }

    /** base64로 인코딩된 32바이트 키를 읽는다 */
    private static SecretKeySpec parse(String configured) {
        if (configured == null || configured.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(configured.trim());
            if (bytes.length != 32) {
                log.error("PROMPICK_MASTER_KEY는 base64로 인코딩한 32바이트여야 합니다 (지금 {}바이트)",
                        bytes.length);
                return null;
            }
            return new SecretKeySpec(bytes, "AES");

        } catch (IllegalArgumentException e) {
            log.error("PROMPICK_MASTER_KEY가 base64 형식이 아닙니다");
            return null;
        }
    }
}
