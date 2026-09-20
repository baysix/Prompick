-- ============================================================================
-- 첫 실제 템플릿: 내 일상 속 미니미
--
-- 지금까지 모든 템플릿은 MOCK 제공사를 써서 몇 초 뒤 샘플 그림을 돌려줬다. 이 템플릿은
-- 실제로 OpenAI를 불러 결과를 만드는 첫 번째 것이다.
--
-- 파이프라인은 한 단계뿐이다. 사진을 받아 그대로 이미지 편집 모델에 넘긴다. 단계를 나누면
-- 매 단계 돈이 들고, 이 프롬프트는 한 번에 처리되도록 이미 충분히 구체적이다.
--
-- 아래 steps.prompt 는 내부 프롬프트다. template_public_prompts 와 다른 테이블에 있고,
-- 사용자용 API 응답에는 어떤 경로로도 실리지 않는다.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. 쓸 모델을 켠다
--    켜지 않으면 파이프라인 실행기가 "사용 중지된 모델"로 거절한다.
-- ---------------------------------------------------------------------------
UPDATE ai_models
   SET active = TRUE,
       memo = '실사 사진 기반 합성. input_fidelity=high 로 인물 형태를 지킨다'
 WHERE provider = 'OPENAI' AND model_key = 'gpt-image-1';

-- ---------------------------------------------------------------------------
-- 2. 템플릿
--    무료로 열어 둔다. 결제가 아직 열리지 않아서, 유료로 두면 아무도 못 만든다.
-- ---------------------------------------------------------------------------
INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'minime-playground',
    '내 일상 속 작은 분신들',
    '사진 속 아이는 그대로 두고, 그 아이를 닮은 3D 미니미들이 주변에서 뛰노는 장면을 만들어요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '2:3',
    '1024x1536',
    150,
    '아이가 나온 사진 1장',
    '{"checklist":[
        "아이의 전신이나 상반신이 또렷하게 나온 사진",
        "얼굴이 가려지지 않은 사진",
        "야외에서 찍은 밝은 사진일수록 잘 나와요",
        "배경에 여백이 조금 있으면 미니미가 놀 자리가 생겨요"
      ],
      "resultNote":"미니미의 수와 행동은 매번 조금씩 달라져요. 아이의 얼굴과 옷은 그대로 유지돼요."}'::jsonb,
    TRUE,
    now()
);

-- ---------------------------------------------------------------------------
-- 3. 사용자가 올릴 사진
-- ---------------------------------------------------------------------------
INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'child_photo', 'IMAGE', '아이 사진',
       '얼굴이 선명하게 나온 사진일수록 미니미가 더 닮게 나와요', TRUE,
       '[]'::jsonb, '{"minWidth":400,"minHeight":400}'::jsonb, 1
FROM templates t
WHERE t.slug = 'minime-playground';

-- ---------------------------------------------------------------------------
-- 4. 실행 파이프라인 (관리자 전용)
--
--    inputs 의 "image" 는 제공사에 넘길 파일 이름이고, 값 "child_photo" 는 위에서 만든
--    입력 필드 키다. 실행기가 이 키로 사용자가 올린 파일을 찾아 붙인다.
-- ---------------------------------------------------------------------------
INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT
    t.id,
    1,
    TRUE,
    jsonb_build_array(
        jsonb_build_object(
            'type', 'GENERATE_IMAGE',
            'modelId', (SELECT id FROM ai_models WHERE provider = 'OPENAI' AND model_key = 'gpt-image-1'),
            'prompt', $prompt$업로드된 실존 사진을 기반으로 작업.

[인물 처리]
- 사진 속 아이를 정확하게 누끼 따서 사용
- 얼굴, 표정, 포즈 절대 변경 금지
- 인물은 화면 중앙 또는 약간 앞쪽에 배치
- 자연스러운 햇빛 방향에 맞는 부드러운 그림자 추가
- 인물 외곽에 얇은 흰색 테두리 (스티커 느낌, 과하지 않게)

[전체 분위기]
- 따뜻한 봄날 느낌 유지
- 부드러운 햇살, 살짝 필름 카메라 감성
- 인스타 감성, 밝고 따뜻한 색감
- 자연스럽고 감성적인 분위기

[미니미 캐릭터 생성]
- 인물을 기반으로 한 3D SD 미니미 캐릭터 3~7개 생성
- 큰 머리 + 작은 몸 (2~3등신 비율)
- 둥글고 말랑한 얼굴, 큰 반짝이는 눈
- 실제 아이의 헤어스타일, 의상 그대로 반영
- 스타일: 귀여운 3D 토이 느낌 (로블록스 + 키덜트 감성)

[미니미 크기]
- 손바닥 크기 정도로 작게
- 원본 인물 주변 자연스럽게 배치

[미니미 행동 - 모두 다르게]
- 인물 옆에 앉아서 쉬는 미니미
- 숨바꼭질하는 미니미
- 꽃을 들고 있는 미니미
- 바닥에 누워 하늘 보는 미니미
- 서로 장난치며 뛰어다니는 미니미

[연출 요소]
- 미니미 주변에 작은 하트, 반짝임, 점선 움직임 효과
- 동선이 보이도록 귀여운 궤적 라인 추가
- 미니미가 실제 공간 위에서 놀고 있는 것처럼 자연스럽게 그림자 적용

[스토리 컨셉]
"내 일상 속 작은 분신들"
- 아이 주변에서 살아 움직이며 함께 노는 느낌
- 현실 + 상상 경계가 섞인 따뜻한 장면

[퀄리티]
- 고해상도
- 자연스럽고 과하지 않은 합성
- 따뜻하고 감성적인 마무리$prompt$,
            'params', jsonb_build_object(
                'size', '1024x1536',
                'quality', 'high',
                'inputFidelity', 'high'
            ),
            'inputs', jsonb_build_object('image', 'child_photo')
        )
    ),
    '한 단계. 업로드 사진을 gpt-image-1 편집으로 바로 넘긴다'
FROM templates t
WHERE t.slug = 'minime-playground';

-- ---------------------------------------------------------------------------
-- 5. 목록에 보일 예시 그림
--    아직 실제 결과물이 없으므로 기존 샘플을 빌려 쓴다. 첫 결과가 나오면 관리자 화면에서
--    진짜 결과물로 바꾼다.
-- ---------------------------------------------------------------------------
INSERT INTO template_media (template_id, media_type, storage_key, thumbnail_key, sort_order)
SELECT t.id, 'IMAGE',
       'public-assets/samples/sample-4.svg', 'public-assets/samples/sample-4.svg', 0
FROM templates t
WHERE t.slug = 'minime-playground';
