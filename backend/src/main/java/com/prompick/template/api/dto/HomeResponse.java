package com.prompick.template.api.dto;

import java.util.List;

/**
 * 홈 화면 데이터.
 *
 * <p>섹션 제목을 서버가 함께 내려주므로, 운영하며 문구를 바꿀 때 프론트 배포가 필요 없다.
 */
public record HomeResponse(List<Section> sections) {

    public record Section(String key, String title, String subtitle, List<TemplateCardResponse> items) {}
}
