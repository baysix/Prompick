-- 나머지 템플릿에도 입력 필드를 넣는다.
--
-- 처음 시드에는 한 템플릿에만 필드를 넣어 두었는데, 필드가 없으면 만들기 화면에 사진을 올릴
-- 자리가 아예 생기지 않는다. 템플릿은 "사진 한 장으로 만든다"가 전제이므로 필드가 없는
-- 템플릿은 사실상 만들 수 없는 템플릿이다.

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'product_photo', 'IMAGE', '제품 사진', '제품 전체가 나오게 찍어주세요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'studio-product-shot';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'dessert_photo', 'IMAGE', '디저트 사진', '가까이에서 찍은 사진이 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'melting-dessert-closeup';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'product_photo', 'IMAGE', '제품 사진 (정면)', '정면에서 찍은 사진', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'cinematic-brand-film';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'product_photo_side', 'IMAGE', '제품 사진 (측면)', '같은 조명에서 찍으면 더 자연스러워요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 2
FROM templates t
WHERE t.slug = 'cinematic-brand-film';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'face_photo', 'IMAGE', '얼굴 사진', '얼굴이 선명하게 나온 사진', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200,"allowFace":true}'::jsonb, 1
FROM templates t
WHERE t.slug = 'film-camera-portrait';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'film_tone', 'SELECT', '필름 느낌', NULL, FALSE,
       '[{"value":"warm","label":"따뜻하게"},{"value":"cool","label":"차갑게"},{"value":"faded","label":"바랜 느낌"}]'::jsonb,
       '{}'::jsonb, 2
FROM templates t
WHERE t.slug = 'film-camera-portrait';
