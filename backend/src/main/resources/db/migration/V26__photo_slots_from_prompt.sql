-- ============================================================================
-- 업로드 칸을 지시문의 @표시에서 만든다.
--
-- 지금까지는 같은 것을 두 군데에 적었다. 업로드 칸을 따로 만들고(`child_photo`), 지시문의
-- 표시를 거기에 이어주었다(`@아이사진 → child_photo`). 두 이름이 달라도 되니 어긋날 자리가
-- 생겼고, 어긋나면 사진이 전달되지 않은 채 글만으로 만들어져 오류 없이 엉뚱한 결과가 나왔다.
--
-- 이제 지시문의 표시가 곧 업로드 칸이다. `@아이사진`이라고 적으면 `아이사진` 칸이 생긴다.
-- inputs 에는 이을 대상 대신 사용자에게 보일 설명만 적는다.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. inputs 값을 "이을 필드"에서 "사용자에게 보일 설명"으로 바꾼다
-- ---------------------------------------------------------------------------
UPDATE template_pipelines p
   SET steps = jsonb_set(p.steps, '{0,inputs}',
           jsonb_build_object('@아이사진', '얼굴이 선명하게 나온 사진일수록 미니미가 더 닮게 나와요')),
       updated_at = now()
 WHERE p.template_id = (SELECT id FROM templates WHERE slug = 'minime-playground');

UPDATE template_pipelines p
   SET steps = jsonb_set(p.steps, '{0,inputs}',
           jsonb_build_object('@인물사진', '얼굴 특징을 그대로 살리니 또렷하게 나온 사진일수록 좋아요')),
       updated_at = now()
 WHERE p.template_id = (SELECT id FROM templates WHERE slug = 'lockscreen-peekaboo');

-- ---------------------------------------------------------------------------
-- 2. 업로드 칸 이름을 표시와 맞춘다
--
--    칸을 지웠다 다시 만들지 않고 이름만 바꾼다. 지우면 id가 바뀌는데, 이미 만들어진 작업이
--    그 칸을 가리키고 있을 수 있다.
-- ---------------------------------------------------------------------------
UPDATE template_input_fields f
   SET field_key = '아이사진',
       label = '아이사진',
       help_text = '얼굴이 선명하게 나온 사진일수록 미니미가 더 닮게 나와요'
  FROM templates t
 WHERE t.id = f.template_id
   AND t.slug = 'minime-playground'
   AND f.field_key = 'child_photo';

UPDATE template_input_fields f
   SET field_key = '인물사진',
       label = '인물사진',
       help_text = '얼굴 특징을 그대로 살리니 또렷하게 나온 사진일수록 좋아요'
  FROM templates t
 WHERE t.id = f.template_id
   AND t.slug = 'lockscreen-peekaboo'
   AND f.field_key = 'person_photo';
