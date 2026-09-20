-- ============================================================================
-- 프롬비 지갑
--
-- 지금까지 잔액은 어디에도 없었다. 사용자 화면에 보이는 0은 하드코딩된 0이고, 유료 제작은
-- 코드에서 막혀 있다. 돈이 오가는 화면을 만들려면 이 토대가 먼저 있어야 한다.
--
-- 설계에서 가장 중요한 것: 잔액은 계산해서 얻는 값이 아니라 저장하는 값이고, 그 변화는
-- 반드시 거래 한 줄을 남긴다. 잔액만 고치고 기록을 안 남기면 "왜 줄었냐"는 문의에 답할 수 없고,
-- 거래만 남기고 잔액을 안 두면 조회할 때마다 전체를 더해야 해서 사용자가 늘면 버티지 못한다.
-- 둘 다 두되, 잔액은 오직 거래를 통해서만 바뀌게 한다.
-- ============================================================================

CREATE TABLE credit_accounts (
    user_id    BIGINT      PRIMARY KEY REFERENCES users (id),

    -- 현재 잔액. 음수가 될 수 없다. 이 제약이 초과 사용을 마지막에 막아주는 그물이다.
    balance    INT         NOT NULL DEFAULT 0,

    -- 누적 충전·사용량. 통계를 낼 때마다 거래를 전부 훑지 않으려고 따로 센다.
    total_charged INT      NOT NULL DEFAULT 0,
    total_spent   INT      NOT NULL DEFAULT 0,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_credit_balance_not_negative CHECK (balance >= 0)
);

COMMENT ON TABLE credit_accounts IS '사용자별 프롬비 잔액. 변경은 credit_transactions를 통해서만 한다';

-- ---------------------------------------------------------------------------
-- 거래 장부
--
-- 한 줄도 지우거나 고치지 않는다. 잘못 넣었으면 반대 방향 거래를 한 줄 더 넣어 바로잡는다.
-- 회계 장부와 같은 원칙이다. 지울 수 있는 장부는 증거가 되지 못한다.
-- ---------------------------------------------------------------------------
CREATE TABLE credit_transactions (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users (id),

    -- 양수는 늘어난 것, 음수는 줄어든 것. 부호로 방향을 담아 합계가 곧 잔액이 되게 한다.
    amount      INT         NOT NULL,

    -- 이 거래 직후의 잔액. 나중에 장부와 잔액이 어긋났을 때 어디서 틀어졌는지 찾는 실마리다.
    balance_after INT       NOT NULL,

    reason      VARCHAR(30) NOT NULL,

    -- 무엇 때문에 생긴 거래인지. 제작이면 job id, 결제면 결제 id.
    ref_type    VARCHAR(30),
    ref_id      BIGINT,

    -- 관리자가 직접 넣거나 뺐다면 누가 왜 했는지. 이것 없이는 감사할 수 없다.
    actor       VARCHAR(100),
    memo        TEXT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_credit_tx_reason CHECK (reason IN (
        'PURCHASE',      -- 사용자가 충전
        'ADMIN_GRANT',   -- 관리자가 지급 (보상, 테스트, 이벤트)
        'ADMIN_REVOKE',  -- 관리자가 회수
        'SIGNUP_BONUS',  -- 가입 축하
        'GENERATE',      -- 제작에 사용
        'PROMPT_UNLOCK', -- 프롬프트 열람에 사용
        'REFUND'         -- 실패 환불
    )),
    CONSTRAINT ck_credit_tx_amount_not_zero CHECK (amount <> 0)
);

COMMENT ON TABLE credit_transactions IS '프롬비 거래 장부. 수정·삭제하지 않는다. 바로잡을 때는 반대 거래를 추가한다';
COMMENT ON COLUMN credit_transactions.balance_after IS '거래 직후 잔액. 장부와 잔액이 어긋났을 때 추적용';

CREATE INDEX idx_credit_tx_user ON credit_transactions (user_id, id DESC);
CREATE INDEX idx_credit_tx_created ON credit_transactions (created_at DESC);
CREATE INDEX idx_credit_tx_reason ON credit_transactions (reason, created_at DESC);

ALTER TABLE credit_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 이미 있는 사용자에게 빈 지갑을 만들어 준다
-- ---------------------------------------------------------------------------
INSERT INTO credit_accounts (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 제작 작업에 원가를 남길 자리
--
-- 사용자에게 받은 프롬비(매출)와 우리가 외부 AI에 쓴 돈(원가)은 다른 값이다. 둘을 같이
-- 기록해야 이 템플릿이 남는 장사인지 알 수 있다. 지금까지는 매출만 있었다.
-- ---------------------------------------------------------------------------
ALTER TABLE generation_jobs
    ADD COLUMN provider_cost_krw INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN generation_jobs.provider_cost_krw IS
    '이 작업에 든 외부 AI 원가(원). 파이프라인 단계 모델의 unit_cost_krw 합계';
