-- ============================================================================
-- 공지사항과 오류 신고
--
-- 둘 다 글이 오가는 표지만 방향이 반대다.
--
--   공지사항 : 운영자 -> 모두.   누구나 읽는다.
--   오류 신고 : 사용자 -> 운영자.  올린 본인과 운영자만 본다.
--
-- 신고를 공개하지 않는 이유가 있다. 사람들은 신고에 "로그인하면 남의 작업이 보여요" 같은
-- 것을 적고, 화면 주소와 무엇을 하다 그랬는지를 함께 적는다. 그것을 게시판에 걸어두면
-- 고치기 전까지 그 글이 곧 공격 안내문이 된다.
-- ============================================================================

CREATE TABLE notices (
    id           BIGSERIAL    PRIMARY KEY,

    title        VARCHAR(160) NOT NULL,
    body         TEXT         NOT NULL,

    -- 점검 안내처럼 기간이 지나면 의미가 없어지는 글이 있다. 중요한 것을 위에 고정한다.
    pinned       BOOLEAN      NOT NULL DEFAULT FALSE,

    -- 비어 있으면 아직 쓰는 중이다. 쓰다 만 공지가 사용자에게 보이면 안 된다.
    published_at TIMESTAMPTZ,

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 목록은 "공개된 것만, 고정 먼저, 최신 먼저"로만 읽는다.
CREATE INDEX idx_notices_published ON notices (published_at DESC) WHERE published_at IS NOT NULL;

COMMENT ON TABLE notices IS '공지사항. published_at 이 비어 있으면 작성 중이라 사용자에게 보이지 않는다';


CREATE TABLE bug_reports (
    id           BIGSERIAL    PRIMARY KEY,

    -- 로그인한 사람만 신고할 수 있다. 되묻지 못하는 신고는 고칠 수 없는 경우가 많다.
    user_id      BIGINT       NOT NULL REFERENCES users (id),

    title        VARCHAR(160) NOT NULL,

    -- 무엇을 하다 그랬는지. 이 칸이 신고의 값어치를 거의 다 결정한다.
    body         TEXT         NOT NULL,

    -- 어느 화면이었는지. 사용자가 적게 하지 않고 화면이 자동으로 채운다.
    -- 말로 설명한 위치는 자주 틀리고, 틀리면 재현하는 데 드는 시간이 배로 든다.
    page_url     VARCHAR(500),

    -- 브라우저·기기. 특정 환경에서만 나는 문제를 가려낸다.
    user_agent   VARCHAR(500),

    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',

    -- 운영자가 남기는 기록. 고쳤다면 무엇을 고쳤는지, 아니라면 왜 아닌지.
    admin_note   TEXT,

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_bug_report_status CHECK (status IN (
        'OPEN',        -- 접수됨. 아직 안 봄
        'CONFIRMED',   -- 재현했음. 고쳐야 할 문제가 맞다
        'FIXED',       -- 고쳤음
        'NOT_A_BUG',   -- 오류가 아니었음. admin_note 에 이유를 남긴다
        'DUPLICATE'    -- 이미 들어온 신고
    ))
);

-- 운영자는 "아직 안 끝난 것"을 먼저 본다.
CREATE INDEX idx_bug_reports_status ON bug_reports (status, id DESC);
CREATE INDEX idx_bug_reports_user ON bug_reports (user_id, id DESC);

COMMENT ON TABLE bug_reports IS '오류 신고. 올린 본인과 운영자만 본다 — 고치기 전의 신고는 공격 안내문이 될 수 있다';

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
