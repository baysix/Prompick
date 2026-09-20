-- ============================================================================
-- 두 번째 실제 템플릿: 폰 잠금화면 빼꼼
--
-- 미니미와 같은 경로(Responses API + gpt-image-2.5-sunburst)를 쓴다. 이 프롬프트도 해석이
-- 많이 필요한 종류다 — "볼이 유리에 눌려 퍼진 느낌", "상단 40%를 비워 시계 자리를 남길 것"
-- 같은 지시는 그림 모델에 직접 넣으면 단어 뭉치로 취급된다.
--
-- 해상도를 864x1536으로 잡은 이유: 9:16을 정확히 맞추면서 가로·세로가 모두 16의 배수여야
-- 한다. 흔히 쓰는 1080x1920은 1080이 16으로 나눠떨어지지 않아 거절당한다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'lockscreen-peekaboo',
    '유리에 눌린 폰 배경화면',
    '사진 속 아이가 화면 안쪽에서 유리를 꾹 누르며 빼꼼 내다보는 잠금화면을 만들어요. 상단은 시계 자리로 비워드려요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '9:16',
    '864x1536',
    150,
    '얼굴이 잘 나온 사진 1장',
    '{"checklist":[
        "얼굴이 정면에 가깝고 또렷하게 나온 사진",
        "볼과 손이 보이면 눌린 표현이 더 살아나요",
        "밝은 곳에서 찍은 사진일수록 좋아요",
        "여러 명이 나온 사진도 괜찮아요"
      ],
      "resultNote":"상단 40%는 시계가 들어갈 자리로 비워져요. 인물이 한 명이면 여러 방향에서 눌린 모습으로 3~4명처럼 표현돼요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, 'person_photo', 'IMAGE', '사진',
       '얼굴 특징을 그대로 살리니 또렷하게 나온 사진일수록 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'lockscreen-peekaboo';

INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT
    t.id,
    1,
    TRUE,
    jsonb_build_array(
        jsonb_build_object(
            'type', 'GENERATE_IMAGE',
            'modelId', (SELECT id FROM ai_models
                         WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2.5-sunburst'),
            'prompt', $prompt$업로드한 사진의 인물은 그대로 유지한 채,
귀엽고 장난스러운 폰 잠금화면 스타일의
배경화면을 제작해줘

[이미지 비율]
9:16 세로형
아이폰 잠금화면용 고해상도 배경화면

[전체 컨셉]
사진의 인물들이 휴대폰 화면 가장자리 곳곳에서
얼굴과 손을 유리에 꾹 누르며
빼꼼 튀어나오는 느낌.

특히:

* 볼이 말랑하게 눌려 찌부된 느낌
* 손바닥이 유리에 눌린 느낌
* 통통한 볼살과 손살이 강조된 귀여운 표현

마치 사진 속 인물들이 휴대폰 화면 안에서
밖을 바라보며 장난치는 듯한 느낌.

전체 분위기는:

* 밝고 포근함
* 귀엽고 장난스러움
* 낙서 같은 사랑스러운 감성
* 캐릭터 배경화면 느낌
* 하지만 얼굴은 실제 인물 특징 유지

[인물 표현]

* 업로드한 사진 속 인물 얼굴 특징 최대한 유지
* AI 느낌 없는 자연스러운 표현
* 실사와 일러스트의 중간 느낌
* 피부는 부드럽고 뽀얗게
* 눈은 또렷하고 동글동글하게
* 볼살과 손등 살집 강조
* 아기와 같이 특유의 말랑한 느낌 표현

[찌부 표현 — 중요]

* 볼이 유리에 눌려 동그랗게 퍼진 느낌
* 손바닥과 손가락이 눌려 납작해진 느낌
* 코끝과 입술도 살짝 눌린 표현 가능
* 약간의 유쾌한 과장 필요
* 젤리처럼 말랑한 압착 표현
* 유리에 닿은 부분은 살짝 퍼지고 붉어짐

[구도]

* 얼굴 일부가 화면 밖으로 잘려도 자연스럽게
* 하단/모서리에서 튀어나오는 구성
* 상단 시계가 잘 보이도록 상단 여백 이미지의 40% 비우기
* 인물이 여러 명이라면 각각 다른 방향으로 눌려있는 포즈
* 인물이 1명이라면 각각 다른 방향에서 같은 인물 3-4명으로 표현

[스타일]

* 단순하고 귀여운 구성
* 연한 파스텔톤
* 밝은 화이트/크림 배경
* 스티커처럼 말랑하고 둥근 느낌
* 유리 표면의 은은한 반사광 추가
(단, 인물 얼굴과 겹치지 않게 반영)

[중요]

* 실제 인물 느낌 유지
* 손가락 개수 오류 금지
* 텍스트/워터마크 생성 금지
* 폰 잠금화면 UI와 잘 어울리는 디자인$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '864x1536',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('image', 'person_photo')
        )
    ),
    '한 단계. 사진과 지시문을 gpt-5.4에 주고 image_generation 툴(sunburst)로 만든다'
FROM templates t
WHERE t.slug = 'lockscreen-peekaboo';
