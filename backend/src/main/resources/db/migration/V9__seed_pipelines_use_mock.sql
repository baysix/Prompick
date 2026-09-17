-- 시드 파이프라인이 실제로 돌아가게 만든다.
--
-- 처음 시드에 넣은 modelId는 PRD 예시에서 그대로 옮긴 임의의 숫자라, 실제 ai_models 행과
-- 맞지 않거나 아직 연동되지 않은 제공사를 가리켰다. 그대로 두면 제작이 "연동되지 않은 제공사"로
-- 실패한다.
--
-- 개발 시드는 MOCK 모델을 가리키게 바꾼다. 실제 제공사는 7단계에서 어댑터를 붙인 뒤,
-- 관리자 화면에서 단계별로 골라 넣는다.

UPDATE template_pipelines p
   SET steps = (
       SELECT jsonb_agg(
           CASE
               -- 영상 단계는 목업 영상 모델로
               WHEN step->>'type' = 'GENERATE_VIDEO' THEN
                   jsonb_set(step, '{modelId}',
                       to_jsonb((SELECT id FROM ai_models WHERE provider = 'MOCK' AND model_key = 'mock-video')))
               -- 그 밖의 생성 단계는 목업 이미지 모델로
               WHEN step->>'type' IN ('GENERATE_IMAGE', 'ANALYZE', 'COMPOSE_PROMPT') THEN
                   jsonb_set(step, '{modelId}',
                       to_jsonb((SELECT id FROM ai_models WHERE provider = 'MOCK' AND model_key = 'mock-image')))
               -- 전처리는 서버 내부 처리 모델로
               ELSE
                   jsonb_set(step, '{modelId}',
                       to_jsonb((SELECT id FROM ai_models WHERE provider = 'INTERNAL' AND model_key = 'remove-background')))
           END
           ORDER BY ordinality
       )
       FROM jsonb_array_elements(p.steps) WITH ORDINALITY AS t(step, ordinality)
   )
 WHERE p.steps IS NOT NULL AND jsonb_array_length(p.steps) > 0;

-- 전처리(배경 제거)는 아직 서버 내부 구현이 없다. 지금은 단계에서 빼고,
-- 실제 구현이 붙을 때 관리자 화면에서 다시 넣는다.
UPDATE template_pipelines p
   SET steps = (
       SELECT COALESCE(jsonb_agg(step ORDER BY ordinality), '[]'::jsonb)
       FROM jsonb_array_elements(p.steps) WITH ORDINALITY AS t(step, ordinality)
       WHERE step->>'type' NOT IN ('PREPROCESS')
   );

-- 단계 수가 바뀌었으므로 진행 표시가 어긋나지 않게 맞춰둔다.
-- (아직 만들어진 작업이 없으므로 실제로 영향받는 행은 없다)
UPDATE generation_jobs j
   SET total_steps = (
       SELECT jsonb_array_length(p.steps) FROM template_pipelines p WHERE p.id = j.pipeline_id
   )
 WHERE j.status IN ('QUEUED', 'RUNNING');
