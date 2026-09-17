-- ============================================================================
-- AI 모델 레지스트리
--
-- 템플릿마다 사용하는 외부 AI가 다르다. 어떤 건 GPT로 이미지를 만들고, 어떤 건 Gemini로
-- 장면을 해석한 뒤 Higgsfield로 영상을 만든다.
--
-- 사용자는 이걸 알 필요가 없다. 관리자가 파이프라인 단계마다 모델을 고르고,
-- 사용자 화면에는 "영상 만드는 중" 같은 일반 문구만 나간다.
-- ============================================================================

CREATE TABLE ai_models (
    id             BIGSERIAL    PRIMARY KEY,
    provider       VARCHAR(30)  NOT NULL,
    model_key      VARCHAR(100) NOT NULL,
    display_name   VARCHAR(100) NOT NULL,

    -- 이 모델이 무엇을 할 수 있는지. 관리자 화면에서 단계 유형에 맞는 모델만 고르게 한다.
    capability     VARCHAR(30)  NOT NULL,

    -- 1회 호출 원가(원). 마진 계산용 참고값이며 사용자에게 보이지 않는다.
    unit_cost_krw  INT          NOT NULL DEFAULT 0,

    -- 모델마다 받는 파라미터가 다르다. 관리자 화면이 이 정의로 입력 폼을 그린다.
    param_schema   JSONB        NOT NULL DEFAULT '{}'::jsonb,

    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order     INT          NOT NULL DEFAULT 0,
    memo           TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_ai_model UNIQUE (provider, model_key),
    CONSTRAINT ck_ai_model_capability CHECK (capability IN (
        'TEXT',          -- 프롬프트 가공, 제품 설명 추출
        'VISION',        -- 이미지 이해 (제품 종류·색상 인식)
        'IMAGE',         -- 이미지 생성
        'IMAGE_EDIT',    -- 이미지 편집 (배경 제거, 인페인팅)
        'VIDEO',         -- 영상 생성
        'AUDIO'          -- 음성·음악 생성
    ))
);

COMMENT ON TABLE ai_models IS '외부 AI 모델 목록. 관리자 전용. 사용자에게 노출하지 않는다';
COMMENT ON COLUMN ai_models.capability IS '이 모델이 담당하는 단계 유형';

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 초기 모델 목록
-- 실제 연동은 7단계. 지금은 MOCK만 동작하고 나머지는 등록만 되어 있다.
-- 원가는 대략값이며 관리자가 조정한다.
-- ---------------------------------------------------------------------------
INSERT INTO ai_models (provider, model_key, display_name, capability, unit_cost_krw, param_schema, active, sort_order, memo) VALUES
    ('MOCK', 'mock-image', '목업 이미지', 'IMAGE', 0,
     '{"aspectRatio":{"type":"select","options":["9:16","1:1","16:9"]}}'::jsonb,
     TRUE, 0, '개발용. 몇 초 뒤 샘플 이미지를 돌려준다'),

    ('MOCK', 'mock-video', '목업 영상', 'VIDEO', 0,
     '{"duration":{"type":"number","min":1,"max":10}}'::jsonb,
     TRUE, 1, '개발용. 몇 초 뒤 샘플 영상을 돌려준다'),

    ('OPENAI', 'gpt-image-1', 'GPT 이미지', 'IMAGE', 60,
     '{"size":{"type":"select","options":["1024x1024","1024x1536","1536x1024"]},"quality":{"type":"select","options":["low","medium","high"]}}'::jsonb,
     FALSE, 10, '레퍼런스 이미지를 함께 넣으면 형태 유지가 좋은 편'),

    ('OPENAI', 'gpt-5', 'GPT 텍스트', 'TEXT', 15,
     '{"temperature":{"type":"number","min":0,"max":2}}'::jsonb,
     FALSE, 11, '사용자 입력을 내부 프롬프트 변수로 가공할 때'),

    ('GOOGLE', 'gemini-2.5-flash', 'Gemini 비전', 'VISION', 10,
     '{}'::jsonb,
     FALSE, 20, '업로드 사진에서 제품 종류·색상을 뽑아 프롬프트 변수에 주입'),

    ('GOOGLE', 'veo-3', 'Veo 영상', 'VIDEO', 900,
     '{"duration":{"type":"number","min":4,"max":8},"resolution":{"type":"select","options":["720p","1080p"]}}'::jsonb,
     FALSE, 21, '원가가 높다. 유료 템플릿에만 쓴다'),

    ('HIGGSFIELD', 'higgsfield-dop', 'Higgsfield 카메라 무빙', 'VIDEO', 700,
     '{"motion":{"type":"select","options":["orbit","dolly-in","crash-zoom","bullet-time"]},"duration":{"type":"number","min":3,"max":10}}'::jsonb,
     FALSE, 30, '카메라 무빙 프리셋이 강점. 광고 영상 주력'),

    ('HIGGSFIELD', 'higgsfield-soul', 'Higgsfield 인물', 'IMAGE', 300,
     '{"preset":{"type":"text"}}'::jsonb,
     FALSE, 31, '인물 사진 스타일 변환'),

    ('RUNWAY', 'gen-4-turbo', 'Runway Gen-4', 'VIDEO', 600,
     '{"duration":{"type":"number","min":5,"max":10},"ratio":{"type":"select","options":["9:16","1:1","16:9"]}}'::jsonb,
     FALSE, 40, '이미지→영상 변환이 안정적'),

    ('KLING', 'kling-2.5', 'Kling', 'VIDEO', 400,
     '{"duration":{"type":"number","min":5,"max":10},"mode":{"type":"select","options":["standard","pro"]}}'::jsonb,
     FALSE, 41, '가성비. 무료 템플릿 후보'),

    ('INTERNAL', 'remove-background', '배경 제거', 'IMAGE_EDIT', 0,
     '{}'::jsonb,
     TRUE, 50, '서버 내부 처리. 외부 API 호출 없음'),

    ('INTERNAL', 'resize-pad', '비율 맞추기', 'IMAGE_EDIT', 0,
     '{"ratio":{"type":"select","options":["9:16","1:1","16:9"]}}'::jsonb,
     TRUE, 51, '서버 내부 처리');

-- 파이프라인 단계가 어떤 모델을 쓰는지 추적할 수 있게 한다.
-- steps JSONB 안의 modelId 로 참조하므로 FK는 걸지 않되, 관리자 화면에서 검증한다.
COMMENT ON COLUMN template_pipelines.steps IS
    '단계 배열. 각 단계의 modelId 는 ai_models.id 를 가리킨다';
