-- ============================================================================
-- 1단계: 템플릿 조회
--
-- 핵심 설계: 프롬프트는 두 종류이고, 테이블부터 분리한다.
--   template_public_prompts : 사람이 읽고 복사해 가는 공개용 원문
--   template_pipelines      : 서버가 실행하는 내부 프롬프트·모델·파라미터 (영구 비공개)
--
-- 같은 테이블에 플래그로 구분하지 않는 이유는, 조건 하나만 빠뜨려도 새기 때문이다.
-- 사용자용 조회 코드는 template_pipelines 를 아예 조인하지 않는다.
-- ============================================================================

CREATE TABLE categories (
    id           BIGSERIAL    PRIMARY KEY,
    content_type VARCHAR(20)  NOT NULL,
    name         VARCHAR(50)  NOT NULL,
    slug         VARCHAR(50)  NOT NULL UNIQUE,
    sort_order   INT          NOT NULL DEFAULT 0,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN categories.content_type IS 'IMAGE / VIDEO / AUDIO';

-- ---------------------------------------------------------------------------
-- 템플릿: 사용자에게 보이는 영역
-- ---------------------------------------------------------------------------
CREATE TABLE templates (
    id                     BIGSERIAL    PRIMARY KEY,
    slug                   VARCHAR(120) NOT NULL UNIQUE,
    title                  VARCHAR(200) NOT NULL,
    description            TEXT,
    content_type           VARCHAR(20)  NOT NULL,
    category_id            BIGINT       NOT NULL REFERENCES categories (id),

    -- 이용 방식별 요금. 하나의 템플릿이 두 가지로 소비된다.
    --   prompt_access   : 프롬프트 원문 제공   FREE / PAID / HIDDEN
    --   generate_access : 자동 제작             FREE / PAID
    prompt_access          VARCHAR(10)  NOT NULL DEFAULT 'HIDDEN',
    prompt_cost            INT          NOT NULL DEFAULT 0,
    generate_access        VARCHAR(10)  NOT NULL DEFAULT 'PAID',
    generate_cost          INT          NOT NULL DEFAULT 0,

    status                 VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',

    -- 결과물 규격. 비율과 길이는 탐색 필터로 쓰이므로 JSONB가 아니라 컬럼으로 둔다.
    ratio                  VARCHAR(10)  NOT NULL DEFAULT '9:16',
    duration_seconds       INT,
    resolution             VARCHAR(20),

    estimated_seconds      INT          NOT NULL DEFAULT 120,
    required_photo_summary VARCHAR(100),
    upload_guide           JSONB        NOT NULL DEFAULT '{}'::jsonb,

    pinned                 BOOLEAN      NOT NULL DEFAULT FALSE,
    trend_score            NUMERIC(12, 4) NOT NULL DEFAULT 0,
    generation_count       BIGINT       NOT NULL DEFAULT 0,
    view_count             BIGINT       NOT NULL DEFAULT 0,
    favorite_count         BIGINT       NOT NULL DEFAULT 0,

    published_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_templates_prompt_access
        CHECK (prompt_access IN ('FREE', 'PAID', 'HIDDEN')),
    CONSTRAINT ck_templates_generate_access
        CHECK (generate_access IN ('FREE', 'PAID')),
    CONSTRAINT ck_templates_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN')),
    -- 유료면 가격이 있어야 하고, 무료·비공개면 0이어야 한다.
    CONSTRAINT ck_templates_prompt_cost
        CHECK ((prompt_access = 'PAID' AND prompt_cost > 0)
            OR (prompt_access <> 'PAID' AND prompt_cost = 0)),
    CONSTRAINT ck_templates_generate_cost
        CHECK ((generate_access = 'PAID' AND generate_cost > 0)
            OR (generate_access = 'FREE' AND generate_cost = 0))
);

COMMENT ON COLUMN templates.prompt_access IS
    'FREE=로그인하면 원문 공개, PAID=프롬비로 열람, HIDDEN=원문 비공개(제작만 가능)';

CREATE INDEX idx_templates_listing
    ON templates (status, content_type, category_id, trend_score DESC, id DESC);
CREATE INDEX idx_templates_ratio ON templates (status, ratio);
CREATE INDEX idx_templates_published
    ON templates (status, published_at DESC, id DESC);

-- 태그
CREATE TABLE template_tags (
    template_id BIGINT      NOT NULL REFERENCES templates (id) ON DELETE CASCADE,
    tag         VARCHAR(40) NOT NULL,
    PRIMARY KEY (template_id, tag)
);

CREATE INDEX idx_template_tags_tag ON template_tags (tag);

-- 예시 결과물. 운영자가 이 템플릿으로 직접 만든 것만 등록한다.
CREATE TABLE template_media (
    template_id   BIGINT       NOT NULL REFERENCES templates (id) ON DELETE CASCADE,
    id            BIGSERIAL    PRIMARY KEY,
    media_type    VARCHAR(20)  NOT NULL,
    storage_key   VARCHAR(500) NOT NULL,
    preview_key   VARCHAR(500),
    thumbnail_key VARCHAR(500),
    sort_order    INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_template_media_type CHECK (media_type IN ('IMAGE', 'VIDEO', 'AUDIO'))
);

COMMENT ON COLUMN template_media.preview_key IS '목록에서 자동재생할 저용량 미리보기';

CREATE INDEX idx_template_media_template ON template_media (template_id, sort_order);

-- 사용자가 채우는 입력 필드
CREATE TABLE template_input_fields (
    id          BIGSERIAL    PRIMARY KEY,
    template_id BIGINT       NOT NULL REFERENCES templates (id) ON DELETE CASCADE,
    field_key   VARCHAR(50)  NOT NULL,
    field_type  VARCHAR(20)  NOT NULL,
    label       VARCHAR(100) NOT NULL,
    help_text   VARCHAR(300),
    required    BOOLEAN      NOT NULL DEFAULT TRUE,
    options     JSONB        NOT NULL DEFAULT '[]'::jsonb,
    validation  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    sort_order  INT          NOT NULL DEFAULT 0,

    CONSTRAINT ck_input_field_type CHECK (field_type IN ('IMAGE', 'SELECT', 'TEXT')),
    CONSTRAINT uq_input_field_key UNIQUE (template_id, field_key)
);

-- ---------------------------------------------------------------------------
-- 공개 프롬프트: 사용자가 읽고 복사해 가는 원문
-- 이 테이블의 내용은 prompt_access 가 FREE/PAID 일 때만 사용자에게 나간다.
-- ---------------------------------------------------------------------------
CREATE TABLE template_public_prompts (
    id                BIGSERIAL    PRIMARY KEY,
    template_id       BIGINT       NOT NULL UNIQUE REFERENCES templates (id) ON DELETE CASCADE,
    body              TEXT         NOT NULL,
    negative_prompt   TEXT,
    recommended_tool  VARCHAR(100),
    usage_tip         TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE template_public_prompts IS
    '공개용 프롬프트 원문. 사용자가 다른 AI 서비스에 붙여넣어 쓰는 용도';
COMMENT ON COLUMN template_public_prompts.recommended_tool IS '어디에 붙여넣으면 되는지 (예: Midjourney v7)';

-- ---------------------------------------------------------------------------
-- 파이프라인: 서버 실행용. 절대 사용자에게 나가지 않는다.
-- ---------------------------------------------------------------------------
CREATE TABLE template_pipelines (
    id          BIGSERIAL    PRIMARY KEY,
    template_id BIGINT       NOT NULL REFERENCES templates (id) ON DELETE CASCADE,
    version     INT          NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT FALSE,
    steps       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    admin_memo  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_pipeline_version UNIQUE (template_id, version)
);

COMMENT ON TABLE template_pipelines IS
    '관리자 전용. 내부 프롬프트·모델·파라미터. 사용자용 API 응답에 절대 포함하지 않는다';

-- 템플릿당 활성 버전은 하나뿐이다.
CREATE UNIQUE INDEX uq_pipeline_active
    ON template_pipelines (template_id) WHERE active;

-- ---------------------------------------------------------------------------
-- 접근 차단 (V2와 동일한 정책을 새 테이블에도 적용)
-- ---------------------------------------------------------------------------
ALTER TABLE categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_media          ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_input_fields   ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_public_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_pipelines      ENABLE ROW LEVEL SECURITY;
