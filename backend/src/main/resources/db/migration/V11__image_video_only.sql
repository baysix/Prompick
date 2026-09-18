-- ============================================================================
-- 만드는 것은 이미지와 영상 둘뿐이다.
--
-- 1) 오디오를 뺀다. 원래 PRD에서도 2단계 항목이었고, 지금 기획에 없다.
-- 2) 주제 카테고리를 선택 항목으로 바꾼다.
--    분류는 "영상이냐 이미지냐" 하나로 충분하다. 그 아래 주제까지 두면 층이 두 개가 되어
--    고를 것이 늘기만 한다. 템플릿이 많아져 묶을 필요가 생기면 그때 다시 쓴다.
-- ============================================================================

-- 오디오 제거
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_content_type_check;
ALTER TABLE templates
    ADD CONSTRAINT ck_templates_content_type CHECK (content_type IN ('IMAGE', 'VIDEO'));

ALTER TABLE template_media DROP CONSTRAINT IF EXISTS ck_template_media_type;
ALTER TABLE template_media
    ADD CONSTRAINT ck_template_media_type CHECK (media_type IN ('IMAGE', 'VIDEO'));

ALTER TABLE generation_outputs
    ADD CONSTRAINT ck_outputs_media_type CHECK (media_type IN ('IMAGE', 'VIDEO'));

-- 오디오 모델은 등록하지 않는다
DELETE FROM ai_models WHERE capability = 'AUDIO';

ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ck_ai_model_capability;
ALTER TABLE ai_models
    ADD CONSTRAINT ck_ai_model_capability CHECK (capability IN (
        'TEXT',        -- 프롬프트 가공
        'VISION',      -- 사진 이해
        'IMAGE',       -- 이미지 생성
        'IMAGE_EDIT',  -- 이미지 편집
        'VIDEO'        -- 영상 생성
    ));

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_content_type_check;

-- 주제 카테고리를 선택 항목으로
ALTER TABLE templates ALTER COLUMN category_id DROP NOT NULL;

COMMENT ON COLUMN templates.category_id IS
    '주제 묶음. 지금은 쓰지 않는다. 템플릿이 많아져 묶을 필요가 생기면 그때 쓴다';

-- 개발용으로 넣어 둔 주제 분류를 비운다. PRD의 예시를 그대로 가져온 것이라 실제 기획이 아니다.
UPDATE templates SET category_id = NULL;
DELETE FROM categories;
