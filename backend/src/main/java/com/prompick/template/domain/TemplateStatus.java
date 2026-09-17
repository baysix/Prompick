package com.prompick.template.domain;

public enum TemplateStatus {
    /** 작성 중. 사용자에게 보이지 않는다 */
    DRAFT,
    /** 게시됨 */
    PUBLISHED,
    /** 내려둠. 링크로도 보이지 않는다 */
    HIDDEN
}
