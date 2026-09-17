-- ============================================================================
-- 개발용 시드 데이터
--
-- 4분면을 모두 덮는다. 화면이 각 조합을 제대로 구분해 보여주는지 확인하기 위해서다.
--
--                   프롬프트 공개        프롬프트 비공개
--   무료 제작   │ ① 유입용 미끼      │ ③ 맛보기 제작
--   유료 제작   │ ② 프리미엄 아카이브 │ ④ 독점 상품
-- ============================================================================

INSERT INTO categories (content_type, name, slug, sort_order) VALUES
    ('VIDEO', '제품 광고',  'product-ad',   1),
    ('VIDEO', '음식',      'food',         2),
    ('VIDEO', '시네마틱',   'cinematic',    3),
    ('IMAGE', '제품 컷',    'product-shot', 4),
    ('IMAGE', '프로필',     'profile',      5);

-- ① 공개 + 무료 제작 : 유입용
INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, duration_seconds, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, trend_score, generation_count, view_count,
    favorite_count, published_at
) VALUES (
    'floating-product-ad',
    '공중에 뜬 제품 광고',
    '제품이 공중에 떠서 천천히 도는 광고 영상이에요. 스마트스토어 상세페이지에 그대로 쓸 수 있어요.',
    'VIDEO',
    (SELECT id FROM categories WHERE slug = 'product-ad'),
    'FREE', 0, 'FREE', 0,
    'PUBLISHED', '9:16', 5, '1080x1920', 120,
    '제품 사진 1장',
    '{"checklist":["정면에서 찍어주세요","제품이 화면의 70% 이상 차지하게","배경은 단색이 좋아요","로고가 선명하게 보이게"],"resultNote":"사진 속 제품의 모양과 색이 그대로 유지돼요"}'::jsonb,
    TRUE, 980.5, 1243, 15200, 340,
    now() - interval '12 days'
);

-- ② 공개 + 유료 제작 : 프리미엄 아카이브
INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, duration_seconds, resolution, estimated_seconds,
    required_photo_summary, upload_guide, trend_score, generation_count, view_count,
    favorite_count, published_at
) VALUES (
    'melting-dessert-closeup',
    '녹아내리는 디저트 클로즈업',
    '디저트가 천천히 녹아내리는 슬로우 모션이에요. 카페 릴스에서 유행하는 그 포맷이에요.',
    'VIDEO',
    (SELECT id FROM categories WHERE slug = 'food'),
    'FREE', 0, 'PAID', 120,
    'PUBLISHED', '9:16', 6, '1080x1920', 180,
    '디저트 사진 1장',
    '{"checklist":["가까이에서 찍어주세요","자연광에서 찍으면 더 좋아요","접시 전체가 나오지 않아도 괜찮아요"],"resultNote":"질감이 실제와 조금 다를 수 있어요"}'::jsonb,
    760.2, 512, 8800, 210,
    now() - interval '6 days'
);

-- ③ 비공개 + 무료 제작 : 맛보기
INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, trend_score, generation_count, view_count,
    favorite_count, published_at
) VALUES (
    'studio-product-shot',
    '스튜디오에서 찍은 것처럼',
    '폰으로 찍은 제품 사진을 스튜디오 촬영본처럼 바꿔요. 배경과 조명이 새로 만들어져요.',
    'IMAGE',
    (SELECT id FROM categories WHERE slug = 'product-shot'),
    'HIDDEN', 0, 'FREE', 0,
    'PUBLISHED', '1:1', '1440x1440', 60,
    '제품 사진 1장',
    '{"checklist":["제품 전체가 나오게 찍어주세요","그림자가 너무 진하지 않게","한 번에 한 제품만"],"resultNote":"제품의 형태는 유지되고 배경만 바뀌어요"}'::jsonb,
    640.0, 2104, 19500, 455,
    now() - interval '20 days'
);

-- ④ 비공개 + 유료 제작 : 독점 상품
INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, duration_seconds, resolution, estimated_seconds,
    required_photo_summary, upload_guide, trend_score, generation_count, view_count,
    favorite_count, published_at
) VALUES (
    'cinematic-brand-film',
    '브랜드 필름처럼 찍힌 한 컷',
    '광고 대행사가 만든 것 같은 시네마틱 영상이에요. 카메라가 제품 주위를 돌면서 빛이 흐릅니다.',
    'VIDEO',
    (SELECT id FROM categories WHERE slug = 'cinematic'),
    'HIDDEN', 0, 'PAID', 250,
    'PUBLISHED', '16:9', 8, '1920x1080', 240,
    '제품 사진 2장',
    '{"checklist":["정면과 측면을 각각 찍어주세요","같은 조명에서 찍으면 더 자연스러워요","배경은 어두울수록 좋아요"],"resultNote":"조명과 분위기는 매번 조금씩 달라져요"}'::jsonb,
    890.7, 328, 12100, 512,
    now() - interval '3 days'
);

-- ⑤ 프롬프트 유료 열람 : 프롬프트 자체를 파는 경우
INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, trend_score, generation_count, view_count,
    favorite_count, published_at
) VALUES (
    'film-camera-portrait',
    '필름 카메라로 찍은 프로필',
    '필름 특유의 입자와 색감이 도는 프로필 사진이에요. 요즘 인스타에서 자주 보이는 그 느낌이에요.',
    'IMAGE',
    (SELECT id FROM categories WHERE slug = 'profile'),
    'PAID', 100, 'PAID', 150,
    'PUBLISHED', '9:16', '1080x1920', 90,
    '얼굴 사진 1장',
    '{"checklist":["얼굴이 선명하게 나온 사진","정면이나 살짝 옆을 보는 각도","너무 어두운 사진은 피해주세요"],"resultNote":"인물의 이목구비는 유지돼요"}'::jsonb,
    712.3, 156, 6400, 180,
    now() - interval '2 days'
);

-- ---------------------------------------------------------------------------
-- 태그
-- ---------------------------------------------------------------------------
INSERT INTO template_tags (template_id, tag)
SELECT id, unnest(ARRAY['제품', '광고', '스마트스토어']) FROM templates WHERE slug = 'floating-product-ad';
INSERT INTO template_tags (template_id, tag)
SELECT id, unnest(ARRAY['음식', '카페', '슬로우모션']) FROM templates WHERE slug = 'melting-dessert-closeup';
INSERT INTO template_tags (template_id, tag)
SELECT id, unnest(ARRAY['제품', '누끼', '상세페이지']) FROM templates WHERE slug = 'studio-product-shot';
INSERT INTO template_tags (template_id, tag)
SELECT id, unnest(ARRAY['시네마틱', '브랜드', '고급']) FROM templates WHERE slug = 'cinematic-brand-film';
INSERT INTO template_tags (template_id, tag)
SELECT id, unnest(ARRAY['프로필', '필름', '인물']) FROM templates WHERE slug = 'film-camera-portrait';

-- ---------------------------------------------------------------------------
-- 공개 프롬프트 (prompt_access 가 FREE / PAID 인 템플릿만)
-- ---------------------------------------------------------------------------
INSERT INTO template_public_prompts (template_id, body, negative_prompt, recommended_tool, usage_tip)
SELECT id,
    'A product floating in mid-air against a seamless pastel backdrop, slowly rotating, soft studio lighting with a gentle rim light, shallow depth of field, commercial product photography, 9:16 vertical',
    'text, watermark, extra objects, distorted logo',
    'Midjourney v7 / Runway Gen-4',
    '제품 사진을 함께 첨부하고 "keep the product exactly as in the reference"를 뒤에 붙이면 형태가 덜 망가져요.'
FROM templates WHERE slug = 'floating-product-ad';

INSERT INTO template_public_prompts (template_id, body, negative_prompt, recommended_tool, usage_tip)
SELECT id,
    'Extreme close-up of a dessert slowly melting, glossy surface catching warm window light, macro lens, 120fps slow motion, shallow focus, appetizing food commercial',
    'plastic texture, artificial colors, hands',
    'Runway Gen-4 / Kling 2.0',
    '"slow motion"을 빼면 움직임이 빨라져서 덜 먹음직스러워 보여요.'
FROM templates WHERE slug = 'melting-dessert-closeup';

INSERT INTO template_public_prompts (template_id, body, negative_prompt, recommended_tool, usage_tip)
SELECT id,
    'Cinematic film portrait, Kodak Portra 400 film grain, warm muted tones, natural window light, 35mm lens, subtle halation around highlights',
    'oversaturated, digital sharpness, beauty filter',
    'Midjourney v7',
    '인물 사진을 레퍼런스로 넣고 --cref 를 쓰면 얼굴이 유지돼요.'
FROM templates WHERE slug = 'film-camera-portrait';

-- ---------------------------------------------------------------------------
-- 파이프라인 (관리자 전용. 사용자 응답에 절대 나가지 않는다)
-- 공개 프롬프트와 내용이 다르다는 점에 주목. 공개해도 이 품질은 재현되지 않는다.
-- ---------------------------------------------------------------------------
INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT id, 1, TRUE,
    '[{"type":"PREPROCESS","action":"REMOVE_BACKGROUND","input":"product_photo"},
      {"type":"GENERATE_IMAGE","modelId":3,"prompt":"INTERNAL: {{product_description}} floating, {{bg_color}} seamless studio backdrop, octane render lighting rig B","params":{"aspectRatio":"9:16","steps":40},"inputs":{"reference":"steps[0].output"}},
      {"type":"GENERATE_VIDEO","modelId":5,"prompt":"INTERNAL: orbit camera 30deg, product rotates 15deg, subtle dust particles","params":{"duration":5},"inputs":{"image":"steps[1].output"}}]'::jsonb,
    '참고 원본: 인스타 릴스 @example (2026-09-02). 회전 각도 15도 넘으면 로고가 깨짐'
FROM templates WHERE slug = 'floating-product-ad';

INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT id, 1, TRUE,
    '[{"type":"PREPROCESS","action":"RESIZE","input":"product_photo"},
      {"type":"GENERATE_IMAGE","modelId":3,"prompt":"INTERNAL: studio product shot, 3-point lighting, seamless white cyclorama","params":{"aspectRatio":"1:1"},"inputs":{"reference":"steps[0].output"}}]'::jsonb,
    '무료 맛보기용. 스텝 수를 낮춰 원가를 줄임'
FROM templates WHERE slug = 'studio-product-shot';

INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT id, 1, TRUE,
    '[{"type":"GENERATE_VIDEO","modelId":7,"prompt":"INTERNAL: anamorphic lens flare, volumetric god rays, dolly orbit, teal-orange grade","params":{"duration":8,"cfg":7.5}}]'::jsonb,
    '독점 상품. 프롬프트 공개 금지'
FROM templates WHERE slug = 'cinematic-brand-film';

-- ---------------------------------------------------------------------------
-- 입력 필드
-- ---------------------------------------------------------------------------
INSERT INTO template_input_fields (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT id, 'product_photo', 'IMAGE', '제품 사진', '정면에서 찍은 사진을 올려주세요', TRUE,
    '[]'::jsonb, '{"minWidth":800,"minHeight":800,"allowFace":false}'::jsonb, 1
FROM templates WHERE slug = 'floating-product-ad';

INSERT INTO template_input_fields (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT id, 'bg_color', 'SELECT', '배경 색', NULL, TRUE,
    '[{"value":"soft pink","label":"연한 분홍"},{"value":"ivory","label":"아이보리"},{"value":"sky blue","label":"하늘색"}]'::jsonb,
    '{}'::jsonb, 2
FROM templates WHERE slug = 'floating-product-ad';
