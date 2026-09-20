-- ============================================================================
-- 제공사 API 키
--
-- 지금까지 키는 .env 에만 있었다. 제공사를 하나 붙일 때마다 파일을 고치고 서버를 다시 띄워야
-- 했는데, 키가 만료되거나 한도가 차는 일은 새벽에도 일어난다. 그때마다 배포할 수는 없다.
--
-- 그래서 DB로 옮기되, 평문으로 두지는 않는다. DB 덤프 한 번이면 모든 제공사의 키가 통째로
-- 나가고, 그 키로 나가는 요금은 전부 우리가 낸다. 값은 봉투 암호화해서 넣고, 그 봉투를 여는
-- 열쇠(마스터 키)는 DB가 아니라 환경변수에 둔다. 둘 중 하나만 털려서는 열리지 않게 한다.
--
-- 키 원문은 어떤 API 응답에도 실리지 않는다. 관리자 화면조차 끝 네 자리만 본다.
-- ============================================================================

CREATE TABLE provider_credentials (
    id              BIGSERIAL    PRIMARY KEY,

    -- ai_models.provider 와 같은 값. 제공사당 키 하나만 둔다.
    provider        VARCHAR(30)  NOT NULL UNIQUE,

    -- AES-GCM 으로 암호화된 키. 마스터 키 없이는 아무 의미가 없는 문자열이다.
    encrypted_value TEXT         NOT NULL,

    -- 화면에 보여줄 끝자리 (예: "...a3f9"). 어느 키를 넣어뒀는지 구분하는 용도다.
    key_hint        VARCHAR(20)  NOT NULL,

    -- 꺼두면 그 제공사를 쓰는 파이프라인이 실패한다. 키를 지우지 않고 잠시 막을 때 쓴다.
    active          BOOLEAN      NOT NULL DEFAULT TRUE,

    memo            TEXT,

    -- 누가 언제 바꿨는지. 키가 바뀐 시점은 장애 원인을 찾을 때 가장 먼저 보는 곳이다.
    updated_by      VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE provider_credentials IS
    '제공사 API 키. 암호화 저장. 원문은 사용자·관리자 API 응답 어디에도 나가지 않는다';
COMMENT ON COLUMN provider_credentials.encrypted_value IS
    'AES-256-GCM. 마스터 키는 PROMPICK_MASTER_KEY 환경변수에만 있다';
COMMENT ON COLUMN provider_credentials.key_hint IS
    '끝 네 자리. 어느 키인지 알아보기 위한 것이지 검증용이 아니다';

ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;
