-- ============================================================================
-- 이미지 모델을 gpt-image-2로 옮긴다.
--
-- gpt-image-1은 2026년 10월 23일에 종료된다. 그 뒤로는 호출이 오류로 떨어진다.
-- 한 달 뒤에 죽을 모델 위에 첫 실제 템플릿을 올려둘 이유가 없다.
--
-- gpt-image-2는 입력 이미지를 항상 고충실도로 처리하므로 input_fidelity를 받지 않는다.
-- 보내면 오류가 나므로 파라미터에서 뺀다.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 새 모델을 등록한다
--    원가는 추정치다. 실제 청구서를 보고 관리자 화면에서 맞춘다.
-- ---------------------------------------------------------------------------
INSERT INTO ai_models (provider, model_key, display_name, capability, unit_cost_krw, param_schema, active, sort_order, memo)
VALUES (
    'OPENAI', 'gpt-image-2', 'GPT 이미지 2', 'IMAGE', 280,
    '{"size":{"type":"text"},"quality":{"type":"select","options":["low","medium","high"]}}'::jsonb,
    TRUE, 9,
    '사진 기반 합성. 입력 이미지를 항상 고충실도로 다루므로 input_fidelity를 보내면 안 된다. 원가는 추정치'
)
ON CONFLICT (provider, model_key) DO UPDATE
   SET active = TRUE,
       capability = EXCLUDED.capability,
       param_schema = EXCLUDED.param_schema,
       memo = EXCLUDED.memo;

-- ---------------------------------------------------------------------------
-- 2. 미니미 템플릿을 새 모델로 옮긴다
--    프롬프트와 입력 연결은 그대로 두고 모델과 파라미터만 바꾼다.
-- ---------------------------------------------------------------------------
UPDATE template_pipelines p
   SET steps = (
       SELECT jsonb_agg(
           jsonb_set(
               jsonb_set(
                   step - 'params',
                   '{modelId}',
                   to_jsonb((SELECT id FROM ai_models
                              WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2'))
               ),
               '{params}',
               jsonb_build_object('size', '1024x1536', 'quality', 'high')
           )
           ORDER BY ordinality
       )
       FROM jsonb_array_elements(p.steps) WITH ORDINALITY AS t(step, ordinality)
   ),
   admin_memo = '한 단계. 업로드 사진을 gpt-image-2 편집으로 바로 넘긴다',
   updated_at = now()
 WHERE p.template_id = (SELECT id FROM templates WHERE slug = 'minime-playground');

-- ---------------------------------------------------------------------------
-- 3. 종료되는 모델은 고르지 못하게 꺼 둔다
--    기록은 남긴다. 예전 작업이 어떤 모델로 만들어졌는지 추적해야 한다.
-- ---------------------------------------------------------------------------
UPDATE ai_models
   SET active = FALSE,
       memo = '2026-10-23 종료. gpt-image-2로 대체했다'
 WHERE provider = 'OPENAI' AND model_key = 'gpt-image-1';
