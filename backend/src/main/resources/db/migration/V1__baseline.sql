-- 0단계 기반 스키마.
-- 운영 중 관리자가 바꿀 수 있는 설정값을 담는다. (PRD 4-9 운영 설정, 15장 미결정 항목)
-- application.yml의 값은 기본값이고, 이 테이블에 값이 있으면 그 값이 우선한다.

CREATE TABLE app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    value       JSONB        NOT NULL,
    description VARCHAR(500),
    updated_by  BIGINT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE app_settings IS '운영 설정값. 배포 없이 정책을 바꾸기 위한 테이블';

INSERT INTO app_settings (setting_key, value, description) VALUES
    ('free.daily_generate_limit',        '3',     '계정당 하루 무료 자동 제작 횟수 (KST 자정 초기화)'),
    ('free.watermark',                   'true',  '무료 결과물에 워터마크를 적용할지'),
    ('free.require_identity_verification','true', '무료 제작에 휴대폰 본인인증을 요구할지'),
    ('credit.default_prompt_cost',       '100',   '유료 템플릿 프롬프트 열람 기본 가격 (프롬비)'),
    ('credit.default_generate_cost',     '100',   '유료 템플릿 자동 제작 기본 가격 (프롬비)'),
    ('credit.signup_bonus',              '0',     '가입 보너스 프롬비'),
    ('output.retention_days',            '30',    '생성 결과물 보관 기간(일)'),
    ('upload.max_size_mb',               '10',    '업로드 최대 용량(MB)'),
    ('trend.weight_generate',            '5',     '트렌드 점수 - 생성 가중치'),
    ('trend.weight_favorite',            '3',     '트렌드 점수 - 찜 가중치'),
    ('trend.weight_view',                '0.1',   '트렌드 점수 - 조회 가중치'),
    ('trend.gravity',                    '1.5',   '트렌드 점수 - 시간 감쇠 지수');
