-- ============================================================================
-- 일곱 번째 템플릿: 제주 돌하르방 아기
--
-- 받은 글 끝에 미드저니 옵션이 붙어 있었다.
--   --ar 3:4 --v 6 --style raw --q 2 --s 750 --uplight --face-detail 1
--
-- 이 표기는 미드저니만 알아듣는다. gpt-image에 그대로 넣으면 지시가 아니라 그냥 글자로
-- 읽히고, 운이 나쁘면 그림 안에 글자로 그려진다. 그래서 그 줄은 뺐다.
--
-- 다만 거기 담긴 뜻은 버리지 않았다. --ar 3:4 는 파이프라인의 size 로 옮겼다. 나머지(--v,
-- --style raw, --face-detail)가 말하는 바 — 사실적으로, 얼굴은 그대로 — 는 이미 본문에
-- 문장으로 적혀 있어 따로 옮길 것이 없었다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'jeju-dolharbang',
    '제주 돌하르방 아기',
    '아이를 돌하르방 옷을 입은 모습으로 제주 바닷가에 앉혀요. 귤나무와 돼지 인형까지 함께 나와요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '3:4',
    '1152x1536',
    180,
    '아이 얼굴이 또렷한 사진 1장',
    '{"checklist":[
        "얼굴이 크고 또렷하게 나온 사진",
        "정면에 가까운 사진일수록 얼굴이 잘 유지돼요",
        "밝은 곳에서 찍은 사진이 좋아요",
        "모자나 손으로 얼굴이 가리지 않은 사진"
      ],
      "resultNote":"옷과 배경은 새로 만들어져요. 아이의 얼굴과 생김새는 그대로 살려요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아이사진', 'IMAGE', '아이사진',
       '얼굴을 그대로 살리는 템플릿이라 또렷하게 나온 사진일수록 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'jeju-dolharbang';

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
            'prompt', $prompt$Ultra high-resolution, hyper-realistic baby photography on a Jeju Island beach, Korea.

A cute Korean baby (around 1 year old) is dressed in a dark gray plush Dolharbang (Jeju stone statue) costume, featuring a rounded hood mimicking the Dolharbang's stone hat.

The baby is sitting on soft golden sand beside a black basalt Dolharbang statue, a mini tangerine tree planted in a wicker basket with ripe orange fruits, and a small pink pig plush toy holding a tangerine in front of the baby.

The baby's face must be preserved exactly as in @아이사진 — no alteration, no stylization, no facial morphing.
The facial proportions and identity should remain identical to the reference.
The baby's expression should feature a cute, gentle smile, capturing warmth and innocence.

The background features a bright Jeju beach with soft waves, under a vivid blue sky filled with fluffy white clouds.
Lighting is natural and warm, creating a soft and sunny atmosphere.
The entire composition should evoke purity, warmth, and whimsical island charm.

Professional baby studio lighting, perfect exposure balance, shallow depth of field (bokeh background), cinematic framing, 8K ultra-detailed texture, realistic fabrics and skin tones.

Keywords: Jeju baby photo, Dolharbang costume, pig plush toy, tangerine tree, Jeju beach, Korean baby, cute smile, hyperrealism, 8K detail, cultural portrait, natural daylight, photorealistic, premium professional photo.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아이사진', '얼굴을 그대로 살리는 템플릿이라 또렷하게 나온 사진일수록 좋아요')
        )
    ),
    '한 단계. 미드저니 옵션 줄은 빼고 --ar 3:4 만 size 로 옮겼다'
FROM templates t
WHERE t.slug = 'jeju-dolharbang';
