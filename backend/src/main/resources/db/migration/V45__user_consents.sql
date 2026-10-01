-- ============================================================================
-- 동의 기록
--
-- 가입할 때 무엇에 동의했는지를 남긴다. users 테이블에 컬럼을 붙이지 않고 따로 두는
-- 이유가 둘 있다.
--
--   1) 버전이 필요하다. 약관이 바뀌면 "언제 동의했나"가 아니라 "어떤 내용에 동의했나"를
--      입증해야 한다. 시각만 남기면 그 사람이 본 문서를 되짚을 수 없다.
--
--   2) 이력이 필요하다. 마케팅 수신 동의는 켰다 껐다 한다. 컬럼 하나면 마지막 상태만
--      남고 언제 철회했는지가 사라지는데, 분쟁은 대개 그 지점에서 난다.
--
-- 그래서 한 줄이 "사건" 하나다. 지우거나 고치지 않고 계속 쌓는다.
-- ============================================================================

CREATE TABLE user_consents (
    id        BIGSERIAL    PRIMARY KEY,
    user_id   BIGINT       NOT NULL REFERENCES users (id),

    -- TERMS    : 이용약관 (필수)
    -- PRIVACY  : 개인정보 수집·이용 (필수)
    -- AGE_14   : 만 14세 이상임 (필수)
    -- MARKETING: 광고성 정보 수신 (선택)
    kind      VARCHAR(20)  NOT NULL,

    -- 동의 당시 보여준 문서의 버전. AGE_14 와 MARKETING 은 개인정보처리방침 버전을 따른다.
    version   VARCHAR(20)  NOT NULL,

    -- 철회도 기록이다. false 로 한 줄 더 쌓는다.
    agreed    BOOLEAN      NOT NULL,

    agreed_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_user_consents_kind
        CHECK (kind IN ('TERMS', 'PRIVACY', 'AGE_14', 'MARKETING'))
);

-- "이 사람의 이 항목, 가장 최근 상태"를 묻는 질의가 대부분이다.
CREATE INDEX idx_user_consents_latest ON user_consents (user_id, kind, agreed_at DESC);

COMMENT ON TABLE user_consents IS '동의 이력. 한 줄이 사건 하나이며 고치거나 지우지 않는다';
COMMENT ON COLUMN user_consents.version IS '동의 당시 문서 버전. 무엇에 동의했는지 되짚기 위해 남긴다';

-- 다른 테이블과 같은 규칙을 따른다. 프론트는 DB에 직접 닿지 않는다. (V2 참고)
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
