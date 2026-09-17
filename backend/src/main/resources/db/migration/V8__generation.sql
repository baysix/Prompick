-- ============================================================================
-- 4단계: 제작
--
-- 사용자가 사진을 올리고 결과물을 받기까지의 기록을 담는다.
--
-- 작업은 요청 즉시 끝나지 않는다. 외부 AI가 수십 초에서 수 분이 걸리므로, 요청은
-- 작업을 만들어두기만 하고 워커가 이어받는다. 사용자가 페이지를 떠나도 계속 진행된다.
-- ============================================================================

-- 사용자가 올린 원본 사진
CREATE TABLE uploads (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users (id),
    storage_key  VARCHAR(500) NOT NULL,
    mime_type    VARCHAR(100),
    size_bytes   BIGINT,
    width        INT,
    height       INT,

    -- 자동 검사 결과. BLOCKED면 이 사진으로는 제작할 수 없다.
    check_status VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
    check_result JSONB        NOT NULL DEFAULT '{}'::jsonb,

    -- 제작에 쓰이지 않은 업로드는 정리한다.
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_uploads_check_status
        CHECK (check_status IN ('PENDING', 'PASSED', 'WARNED', 'BLOCKED'))
);

CREATE INDEX idx_uploads_user ON uploads (user_id, created_at DESC);

-- 제작 요청 한 건
CREATE TABLE generation_jobs (
    id                     BIGSERIAL    PRIMARY KEY,
    user_id                BIGINT       NOT NULL REFERENCES users (id),
    template_id            BIGINT       NOT NULL REFERENCES templates (id),

    -- 요청 시점의 파이프라인 버전. 관리자가 중간에 파이프라인을 고쳐도
    -- 진행 중인 작업은 시작할 때의 방식으로 끝까지 실행된다.
    pipeline_id            BIGINT       NOT NULL REFERENCES template_pipelines (id),

    status                 VARCHAR(12)  NOT NULL DEFAULT 'QUEUED',

    -- 요청 시점의 요금. 관리자가 가격을 바꿔도 이미 시작한 작업에는 영향이 없다.
    charge_type            VARCHAR(10)  NOT NULL,
    credit_cost_snapshot   INT          NOT NULL DEFAULT 0,

    inputs                 JSONB        NOT NULL DEFAULT '{}'::jsonb,
    current_step           INT          NOT NULL DEFAULT 0,
    total_steps            INT          NOT NULL DEFAULT 0,

    -- 사용자에게 보여줄 내부 에러 코드. 외부 API 응답 원문은 담지 않는다.
    error_code             VARCHAR(50),

    -- 같은 사용자가 같은 키로 두 번 보내면 작업이 하나만 생긴다.
    idempotency_key        VARCHAR(100) NOT NULL,

    -- 워커가 집어간 작업을 다른 워커가 건드리지 않게 한다.
    locked_by              VARCHAR(60),
    locked_until           TIMESTAMPTZ,
    retry_count            INT          NOT NULL DEFAULT 0,

    started_at             TIMESTAMPTZ,
    finished_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_jobs_status
        CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED')),
    CONSTRAINT ck_jobs_charge_type CHECK (charge_type IN ('FREE', 'PAID')),
    CONSTRAINT uq_jobs_idempotency UNIQUE (user_id, idempotency_key)
);

-- 워커가 집어갈 작업을 찾는 경로
CREATE INDEX idx_jobs_pickup ON generation_jobs (status, locked_until, id);
CREATE INDEX idx_jobs_user ON generation_jobs (user_id, created_at DESC);

COMMENT ON COLUMN generation_jobs.error_code IS '내부 에러 코드. 외부 API 응답 원문은 담지 않는다';

-- 단계별 실행 기록. 관리자 전용이며 사용자 응답에 나가지 않는다.
CREATE TABLE generation_job_steps (
    id                BIGSERIAL    PRIMARY KEY,
    job_id            BIGINT       NOT NULL REFERENCES generation_jobs (id) ON DELETE CASCADE,
    step_index        INT          NOT NULL,
    status            VARCHAR(12)  NOT NULL DEFAULT 'QUEUED',

    -- 외부 제공사가 준 작업 id. 사용자에게 절대 노출하지 않는다.
    external_job_id   VARCHAR(200),
    output_storage_key VARCHAR(500),

    -- 실패 원인 원문. 운영자가 보는 값이다.
    error_detail      TEXT,

    started_at        TIMESTAMPTZ,
    finished_at       TIMESTAMPTZ,

    CONSTRAINT uq_job_step UNIQUE (job_id, step_index)
);

COMMENT ON TABLE generation_job_steps IS
    '관리자 전용. external_job_id와 error_detail은 사용자 응답에 절대 포함하지 않는다';

-- 완성된 결과물
CREATE TABLE generation_outputs (
    id            BIGSERIAL    PRIMARY KEY,
    job_id        BIGINT       NOT NULL REFERENCES generation_jobs (id) ON DELETE CASCADE,
    media_type    VARCHAR(20)  NOT NULL,
    storage_key   VARCHAR(500) NOT NULL,
    thumbnail_key VARCHAR(500),
    watermarked   BOOLEAN      NOT NULL DEFAULT FALSE,

    -- 보관 기간이 지나면 파일을 지운다.
    expires_at    TIMESTAMPTZ,
    deleted_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_outputs_job ON generation_outputs (job_id);
CREATE INDEX idx_outputs_expiry ON generation_outputs (expires_at) WHERE deleted_at IS NULL;

-- 무료 제작 일일 사용량. KST 자정에 초기화된다.
CREATE TABLE free_usage_daily (
    user_id    BIGINT NOT NULL REFERENCES users (id),
    usage_date DATE   NOT NULL,
    used_count INT    NOT NULL DEFAULT 0,

    PRIMARY KEY (user_id, usage_date),
    CONSTRAINT ck_free_usage_non_negative CHECK (used_count >= 0)
);

COMMENT ON TABLE free_usage_daily IS '무료 제작 일일 사용량. usage_date는 KST 기준';

ALTER TABLE uploads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_job_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_outputs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_usage_daily     ENABLE ROW LEVEL SECURITY;
