-- ============================================================================
-- 사진 최소 크기를 낮춘다.
--
-- 미니미 템플릿에 400x400을 걸어뒀는데, 이건 근거가 없는 숫자였다. "얼굴이 들어가니까 크면
-- 좋겠지"라는 짐작으로 정했을 뿐이고, 실제로 이미지 모델은 그보다 작은 사진도 잘 받는다.
--
-- 폰으로 찍어 카톡으로 한 번 오간 사진은 세로가 400을 못 넘기는 일이 흔하다. 그런 사진이
-- 대부분인데 그걸 막아두면, 정작 만들 수 있는 것을 못 만들게 된다.
--
-- 다른 템플릿과 같은 200으로 맞춘다. 그보다 크더라도 작은 편이면 막지 않고 "더 큰 사진일수록
-- 또렷하다"고 알려만 준다 — 그 판단은 올리는 사람이 한다.
-- ============================================================================

UPDATE template_input_fields f
   SET validation = '{"minWidth":200,"minHeight":200}'::jsonb
  FROM templates t
 WHERE t.id = f.template_id
   AND t.slug = 'minime-playground'
   AND f.field_key = 'child_photo';

UPDATE template_input_fields f
   SET help_text = '얼굴이 선명하게 나온 사진일수록 미니미가 더 닮게 나와요. 폰으로 찍은 사진이면 충분해요'
  FROM templates t
 WHERE t.id = f.template_id
   AND t.slug = 'minime-playground'
   AND f.field_key = 'child_photo';
