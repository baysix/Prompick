-- ============================================================================
-- 미니미 템플릿을 실제로 검증된 설정으로 고정한다.
--
-- 지금까지 모델을 바꿔가며 직접 UPDATE로 시험했다. 그 상태로 두면 코드에는 없고 DB에만 있는
-- 설정이 되어, 새로 배포하는 환경에서는 재현되지 않는다. 검증이 끝났으니 여기에 박아 둔다.
--
-- gpt-image-2.5-sunburst + Responses API 조합이 프롬프트 의도를 가장 잘 따랐다. 특히
-- [미니미 캐릭터 생성] 블록 — 2~3등신 3D 토이 스타일 — 은 이 조합에서만 제대로 반영됐다.
-- gpt-image-2로 이미지 API를 직접 부르면 미니미가 실사 축소판으로 나와 의도와 달라진다.
-- ============================================================================

UPDATE template_pipelines p
   SET steps = jsonb_set(
           jsonb_set(
               p.steps,
               '{0,modelId}',
               to_jsonb((SELECT id FROM ai_models
                          WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2.5-sunburst'))
           ),
           '{0,params}',
           jsonb_build_object(
               'api', 'responses',
               'mainlineModel', 'gpt-6-astra',
               'size', '1024x1536',
               'quality', 'high'
           )
       ),
       admin_memo = '검증 완료. 사진과 지시문을 gpt-6-astra에 주고 image_generation 툴(sunburst)로 만든다',
       updated_at = now()
 WHERE p.template_id = (SELECT id FROM templates WHERE slug = 'minime-playground');

-- ---------------------------------------------------------------------------
-- 실측 원가를 반영한다.
--
-- 아래 값은 1024x1536 high 기준 공개 단가에서 환산한 추정치다. 실제 청구서를 본 뒤
-- 관리자 화면(AI 모델)에서 맞추는 것을 전제로 한다. 추정이라는 사실을 메모에 남긴다.
-- ---------------------------------------------------------------------------
UPDATE ai_models
   SET unit_cost_krw = 300,
       memo = 'Responses API의 image_generation 툴로 쓴다. 1024x1536 high 기준 추정 300원. 청구서 보고 보정할 것'
 WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2.5-sunburst';

UPDATE ai_models
   SET unit_cost_krw = 280,
       memo = '이미지 API 직접 호출용. 사진 편집에 치우쳐 캐릭터 스타일 지시는 덜 따른다. 추정 280원'
 WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2';
