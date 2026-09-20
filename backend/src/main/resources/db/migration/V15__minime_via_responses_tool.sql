-- ============================================================================
-- 미니미 템플릿을 "이미지 생성 툴" 경로로 옮긴다.
--
-- 이 프롬프트는 ChatGPT 화면에서 만들어진 것이다. 거기서는 추론 모델이 사진을 보고 긴 지시문을
-- 해석한 뒤에 이미지 생성 툴을 부른다. 우리가 붙였던 이미지 API는 그 중간 단계가 없어서,
-- "누끼를 따서" "3~7개를 모두 다르게" 같은 문장을 읽고 판단해 줄 쪽이 아무도 없었다.
--
-- 그래서 Responses API의 image_generation 툴을 쓴다. 파이프라인 단계의 api 파라미터가
-- 어느 경로를 탈지 정하고, 편집 정밀도가 높은 이미지 모델을 붙인다.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 이미지 생성 툴에서 쓸 모델을 등록한다
--    sunburst는 정밀한 편집용이다. 원본 아이의 얼굴을 지켜야 하는 이 템플릿에 맞다.
-- ---------------------------------------------------------------------------
INSERT INTO ai_models (provider, model_key, display_name, capability, unit_cost_krw, param_schema, active, sort_order, memo)
VALUES (
    'OPENAI', 'gpt-image-2.5-sunburst', 'GPT 이미지 2.5 (정밀 편집)', 'IMAGE', 300,
    '{"size":{"type":"text"},
      "quality":{"type":"select","options":["low","medium","high","xhigh","max","auto"]},
      "api":{"type":"select","options":["images","responses"]},
      "mainlineModel":{"type":"text"}}'::jsonb,
    TRUE, 8,
    'Responses API의 image_generation 툴로 쓴다. 추론 모델이 지시문을 해석해 주므로 긴 한국어 지시문에 강하다. 원가는 추정치'
)
ON CONFLICT (provider, model_key) DO UPDATE
   SET active = TRUE,
       capability = EXCLUDED.capability,
       param_schema = EXCLUDED.param_schema,
       memo = EXCLUDED.memo;

-- ---------------------------------------------------------------------------
-- 2. 미니미 템플릿을 이 경로로 돌린다
--    프롬프트와 입력 연결(child_photo)은 그대로 두고 모델과 파라미터만 바꾼다.
-- ---------------------------------------------------------------------------
UPDATE template_pipelines p
   SET steps = (
       SELECT jsonb_agg(
           jsonb_set(
               jsonb_set(
                   step - 'params',
                   '{modelId}',
                   to_jsonb((SELECT id FROM ai_models
                              WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2.5-sunburst'))
               ),
               '{params}',
               jsonb_build_object(
                   'api', 'responses',
                   -- 앞에 세울 추론 모델. 이름이 바뀌면 관리자 화면에서 여기만 고치면 된다.
                   'mainlineModel', 'gpt-6-astra',
                   'size', '1024x1536',
                   'quality', 'high'
               )
           )
           ORDER BY ordinality
       )
       FROM jsonb_array_elements(p.steps) WITH ORDINALITY AS t(step, ordinality)
   ),
   admin_memo = '한 단계. 사진과 지시문을 추론 모델에 함께 주고 image_generation 툴로 만들게 한다',
   updated_at = now()
 WHERE p.template_id = (SELECT id FROM templates WHERE slug = 'minime-playground');

-- ---------------------------------------------------------------------------
-- 3. 이미지 API 직접 호출용 모델도 파라미터 정의를 맞춰 둔다
--    다른 템플릿이 그쪽을 쓸 수 있으므로 끄지는 않는다.
-- ---------------------------------------------------------------------------
UPDATE ai_models
   SET param_schema = '{"size":{"type":"text"},
                        "quality":{"type":"select","options":["low","medium","high"]},
                        "api":{"type":"select","options":["images","responses"]}}'::jsonb
 WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2';
