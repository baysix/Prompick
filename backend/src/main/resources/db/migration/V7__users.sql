-- ============================================================================
-- 회원
--
-- 로그인 자체는 Supabase Auth가 처리한다. auth.users 에 계정이 만들어지고,
-- 우리는 그 id(uuid)를 가리키는 우리 쪽 회원 행을 따로 둔다.
--
-- auth.users 를 직접 쓰지 않고 분리하는 이유:
--   - 프롬비 잔액, 본인인증 여부, 정지 상태 같은 서비스 고유 정보를 담아야 한다
--   - 나중에 Supabase를 떠나더라도 회원 데이터가 그대로 남는다
--   - auth 스키마는 Supabase가 관리하므로 우리가 컬럼을 추가할 수 없다
-- ============================================================================

CREATE TABLE users (
    id                BIGSERIAL    PRIMARY KEY,

    -- Supabase Auth 의 사용자 id. 토큰의 sub 클레임과 같다.
    auth_user_id      UUID         NOT NULL UNIQUE,

    email             VARCHAR(255),
    nickname          VARCHAR(30)  NOT NULL,
    role              VARCHAR(10)  NOT NULL DEFAULT 'USER',
    status            VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',

    -- 휴대폰 본인인증. 무료 제작에 필요하다.
    phone_verified_at TIMESTAMPTZ,
    -- 본인인증 고유식별값(CI)의 해시. 같은 사람이 계정을 여러 개 만들어
    -- 무료 횟수를 반복해서 쓰는 것을 막는다. 원본 CI는 저장하지 않는다.
    ci_hash           VARCHAR(128) UNIQUE,

    last_login_at     TIMESTAMPTZ,
    withdrawn_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_users_role CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN'))
);

COMMENT ON COLUMN users.auth_user_id IS 'Supabase Auth 사용자 id. JWT의 sub 클레임';
COMMENT ON COLUMN users.ci_hash IS '본인인증 CI의 해시. 무료 횟수 어뷰징 방지용. 원본은 저장하지 않는다';

CREATE INDEX idx_users_email ON users (email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
