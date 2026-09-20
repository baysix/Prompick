-- ============================================================================
-- 네 번째 템플릿: 밀짚모자 여름 사진
--
-- 앞의 셋과 성격이 다르다. 미니미·잠금화면·이모티콘은 사진을 재료로 새로운 것을 만들었지만,
-- 이것은 같은 아이를 다른 빛과 계절 속에 다시 찍는 쪽에 가깝다. 그래서 프롬프트도 합성 지시가
-- 아니라 촬영 지시문처럼 쓰여 있다 — 렌즈, 조리개, 필름 감성까지.
--
-- 지시문은 받은 그대로 두었다. 한 군데만 고쳤는데, "the uploaded real baby"를 @아기사진 으로
-- 바꾼 것이다. 이 표시가 있어야 사용자가 올린 사진이 실제로 모델에 전달되고, 관리자 화면에도
-- 업로드 칸이 만들어진다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'straw-hat-portrait',
    '밀짚모자 여름 사진',
    '한여름 정원에서 밀짚모자 사이로 볕이 스며드는 필름 사진처럼 만들어요. 90년대 일본 잡지 화보 느낌이에요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '3:4',
    '1152x1536',
    180,
    '아기 얼굴이 또렷한 사진 1장',
    '{"checklist":[
        "얼굴이 크게 나온 사진",
        "눈이 또렷하게 보이는 사진",
        "그늘보다는 밝은 곳에서 찍은 사진",
        "모자나 손으로 이마가 가리지 않은 사진"
      ],
      "resultNote":"밀짚모자와 배경은 새로 만들어져요. 아이의 얼굴 특징은 그대로 살려요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아기사진', 'IMAGE', '아기사진',
       '얼굴이 크고 또렷하게 나온 사진일수록 잘 나와요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'straw-hat-portrait';

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
            'prompt', $prompt$portrait of a little baby,
a vertical 3:4 realistic studio portrait of @아기사진.

A dreamy close-up summer portrait of an East Asian baby with a naturally
gender-neutral appearance, standing outdoors on a bright summer afternoon,
wearing a wide-brim sun hat woven from natural straw.
The baby's short, slightly tousled, soft, fine hair falls naturally across
the forehead in delicate wispy strands, while a few loose strands gently
sway in the summer breeze. Large dark curious eyes, delicate baby features,
naturally sun-kissed and flushed cheeks, soft natural pink lips,
and realistic soft baby skin texture.
The baby quietly looks sideways toward the camera with a calm,
slightly mysterious, curious, and contemplative expression.
The intense summer sunlight filters through the small,
irregular textured gaps of the straw hat, creating intricate scattered patterns
of light and tiny glowing highlights across the baby's eyes, cheeks, nose, lips,
neck, shoulders, and collarbone. Lace-like dappled sunlight and
patterned shadows fall naturally across the baby's face,
with luminous spots of sunlight glowing warmly against the skin
beneath the shade of the hat.
The baby wears a simple ivory-white cotton summer tank top
with thin shoulder straps, a loose natural silhouette,
and a minimal nostalgic aesthetic. The clothing is simple,
timeless, and gender-neutral.
A very intimate close-up portrait,
with the baby's face occupying most of the frame and part of the shoulders
visible, the oversized straw hat dominating the upper part of the composition,
slightly off-center framing, eye-level camera,
spontaneous and natural composition.
A bright, lush green summer garden in the background,
rendered completely soft with creamy green and turquoise bokeh,
strong separation between the subject and background, very shallow
depth of field.
Shot like a nostalgic 35mm analog photograph from a Japanese summer,
inspired by late-1990s to early-2000s Japanese magazine editorial photography,
dreamy youthful summer atmosphere, warm creamy skin tones,
slightly faded organic greens, soft pastel color palette,
subtle film grain, understated highlight bloom,
slightly overexposed highlights, imperfect natural exposure,
soft focus, delicate analog texture, and poetic cinematic realism.

50mm lens, f/1.8, natural light, very shallow depth of field,
realistic analog photography, candid childhood portrait,
gender-neutral styling.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아기사진', '얼굴이 크고 또렷하게 나온 사진일수록 잘 나와요')
        )
    ),
    '한 단계. 촬영 지시문형 프롬프트라 해석이 필요해 responses 경로를 쓴다'
FROM templates t
WHERE t.slug = 'straw-hat-portrait';
