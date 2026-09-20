-- ============================================================================
-- 파이프라인의 size를 비율로 적는다.
--
-- 지금까지는 픽셀로 적었다(864x1536). 그러려면 "9:16이 864x1536"이라는 것과 "가로·세로가
-- 16의 배수여야 한다"는 것을 사람이 외우고 있어야 했다. 실제로 흔히 쓰는 1080x1920을 넣었다가
-- 거절당한 적이 있다 — 1080이 16으로 나눠떨어지지 않기 때문인데, 이런 것은 기억할 일이 아니다.
--
-- 이제 비율만 고르면 서버가 픽셀을 계산한다. 긴 변을 1536으로 두고 짧은 변을 비율에서 구한 뒤
-- 둘 다 16의 배수로 맞춘다. 픽셀을 직접 적는 길도 남겨두었다 — 특별한 크기가 필요한 경우를
-- 막을 이유는 없다.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 관리자 화면이 비율을 고르게 한다
-- ---------------------------------------------------------------------------
UPDATE ai_models
   SET param_schema = jsonb_set(
           param_schema,
           '{size}',
           '{"type":"select","options":["9:16","2:3","3:4","4:5","1:1","3:2","16:9"]}'::jsonb)
 WHERE provider = 'OPENAI'
   AND model_key IN ('gpt-image-2.5-sunburst', 'gpt-image-2');

-- ---------------------------------------------------------------------------
-- 2. 이미 저장된 파이프라인의 픽셀 값을 비율로 바꾼다
--
--    864x1536 -> 9:16, 1024x1536 -> 2:3, 1536x1536 -> 1:1
-- ---------------------------------------------------------------------------
UPDATE template_pipelines p
   SET steps = (
       SELECT jsonb_agg(
           CASE
               WHEN step->'params'->>'size' IS NULL THEN step
               ELSE jsonb_set(step, '{params,size}', to_jsonb(
                   CASE step->'params'->>'size'
                       WHEN '864x1536'  THEN '9:16'
                       WHEN '1024x1536' THEN '2:3'
                       WHEN '1152x1536' THEN '3:4'
                       WHEN '1536x1536' THEN '1:1'
                       WHEN '1024x1024' THEN '1:1'
                       WHEN '1536x1024' THEN '3:2'
                       WHEN '1536x864'  THEN '16:9'
                       -- 표에 없는 값은 그대로 둔다. 픽셀도 여전히 받으므로 깨지지 않는다.
                       ELSE step->'params'->>'size'
                   END))
           END
           ORDER BY ordinality
       )
       FROM jsonb_array_elements(p.steps) WITH ORDINALITY AS t(step, ordinality)
   ),
   updated_at = now()
 WHERE p.steps IS NOT NULL AND jsonb_array_length(p.steps) > 0;
