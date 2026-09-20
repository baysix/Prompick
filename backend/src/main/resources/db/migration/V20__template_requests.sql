-- ============================================================================
-- 요청 게시판
--
-- 사용자에게는 "없는 걸 만들어 달라"는 창구이고, 운영자에게는 다음에 무엇을 만들지 알려주는
-- 트렌드 레이더다. 무엇을 만들지 감으로 정하지 않게 해주는 것이 이 표의 진짜 값어치다.
--
-- 그래서 추천 수가 중요하다. 요청 하나하나보다 "같은 걸 원하는 사람이 몇 명인가"가 만들 순서를
-- 정한다. 추천은 한 사람당 한 번만 되어야 그 숫자를 믿을 수 있으므로 별도 표로 분리한다.
-- ============================================================================

CREATE TABLE template_requests (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users (id),

    title         VARCHAR(120) NOT NULL,

    -- 인스타·틱톡·유튜브 링크. 말로 설명하는 것보다 원본을 보는 쪽이 빠르다.
    reference_url VARCHAR(500),
    description   TEXT,

    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING',

    -- 추천 수. template_request_votes 를 세어도 되지만, 목록을 추천순으로 정렬할 때마다
    -- 전부 세면 느려진다. 투표할 때 같이 올린다.
    vote_count    INT          NOT NULL DEFAULT 0,

    -- 완성되면 어느 템플릿이 되었는지. 요청한 사람이 결과를 보러 갈 수 있어야 한다.
    template_id   BIGINT       REFERENCES templates (id) ON DELETE SET NULL,

    -- 운영자가 남기는 답. 반려한다면 왜인지 적어야 한다.
    admin_note    TEXT,

    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_request_status CHECK (status IN (
        'PENDING',    -- 올라옴. 아직 안 봄
        'REVIEWING',  -- 검토 중
        'BUILDING',   -- 만드는 중
        'DONE',       -- 완성. template_id 가 채워진다
        'REJECTED'    -- 반려. admin_note 에 이유를 남긴다
    )),
    CONSTRAINT ck_request_done_has_template
        CHECK (status <> 'DONE' OR template_id IS NOT NULL)
);

COMMENT ON TABLE template_requests IS '사용자가 만들어 달라고 올린 요청. 다음에 무엇을 만들지 정하는 근거';
COMMENT ON COLUMN template_requests.vote_count IS '추천 수. template_request_votes 와 함께 갱신한다';

CREATE INDEX idx_requests_status ON template_requests (status, vote_count DESC, id DESC);
CREATE INDEX idx_requests_latest ON template_requests (id DESC);
CREATE INDEX idx_requests_user   ON template_requests (user_id, id DESC);

-- ---------------------------------------------------------------------------
-- 추천
--
-- 한 사람이 한 요청에 한 번만. 이 제약이 없으면 추천 수는 "얼마나 열심히 눌렀나"를 뜻하게 되고,
-- 만들 순서를 정하는 근거로 쓸 수 없게 된다.
-- ---------------------------------------------------------------------------
CREATE TABLE template_request_votes (
    request_id BIGINT      NOT NULL REFERENCES template_requests (id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (request_id, user_id)
);

COMMENT ON TABLE template_request_votes IS '요청 추천. 한 사람당 한 번';

ALTER TABLE template_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_request_votes ENABLE ROW LEVEL SECURITY;
