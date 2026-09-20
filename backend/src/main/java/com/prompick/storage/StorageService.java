package com.prompick.storage;

import java.io.InputStream;
import java.time.Duration;

/**
 * 파일 저장소 추상화.
 *
 * <p>기본 구현은 {@link SupabaseStorage}이고, 네트워크 없이 개발할 때는 {@link LocalFileStorage}로 바꾼다.
 * 구현이 바뀌어도 호출하는 쪽 코드는 바뀌지 않는다. DB에는 파일이 아니라 storageKey만 저장한다.
 *
 * <p><b>storageKey 형식은 {@code "버킷명/경로/파일명"}이다.</b> 예: {@code uploads/2026/09/abc.jpg}
 * 첫 번째 슬래시 앞이 버킷 이름이 된다.
 */
public interface StorageService {

    /**
     * 클라이언트가 직접 업로드할 수 있는 URL을 발급한다.
     *
     * @param storageKey 저장 경로 (예: {@code uploads/2026/09/abc.jpg})
     * @param contentType 업로드할 파일의 MIME 타입
     * @param ttl 발급된 URL의 유효 시간
     */
    PresignedUpload presignUpload(String storageKey, String contentType, Duration ttl);

    /**
     * 짧은 만료 시간을 가진 다운로드·미리보기 URL을 발급한다.
     *
     * <p>발급에 네트워크 호출이 필요할 수 있으므로, 목록처럼 여러 건을 한 번에 그리는 화면에서는 쓰지 않는다.
     * 비공개 버킷(업로드 원본, 생성 결과물) 전용이다.
     */
    String presignDownload(String storageKey, Duration ttl);

    /**
     * 브라우저가 화면에 띄우는 대신 파일로 저장하게 만드는 주소.
     *
     * <p>HTML의 {@code download} 속성은 다른 도메인 주소에는 듣지 않는다. 브라우저가 일부러
     * 무시하기 때문이다. 결과물은 스토리지 도메인에 있으므로, 저장하게 하려면 서버가 파일이라고
     * 알려주는 수밖에 없다.
     *
     * @param fileName 저장될 이름
     */
    default String presignDownload(String storageKey, Duration ttl, String fileName) {
        return presignDownload(storageKey, ttl);
    }

    /**
     * 공개 버킷의 파일 주소. 서명하지 않으므로 네트워크 호출이 없다.
     *
     * <p>템플릿 예시 결과물·가이드 이미지처럼 검색 노출되어야 하고 누가 봐도 괜찮은 파일에만 쓴다.
     */
    String publicUrl(String storageKey);

    /** 서버가 직접 파일을 저장한다. (외부 AI 결과물 복사, 워터마크 적용본 저장 등) */
    void put(String storageKey, InputStream content, String contentType, long contentLength);

    InputStream get(String storageKey);

    boolean exists(String storageKey);

    void delete(String storageKey);

    /** 업로드 URL과, 업로드 시 함께 보내야 하는 헤더. */
    record PresignedUpload(String url, String method, java.util.Map<String, String> headers) {}
}
