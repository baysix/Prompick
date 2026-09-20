-- ============================================================================
-- 아홉 번째 템플릿: 반은 사진, 반은 그림 포스터
--
-- 받은 글은 "올린 사진마다 각각 포스터를 만들고 절대 한 장에 합치지 말라"는 배치
-- 작업 전제로 쓰여 있었다. 우리 파이프라인은 한 번에 한 장을 만든다. 그래서 첫 문단을
-- 한 장 기준으로 고쳐 썼다. 그대로 두면 갈 곳 없는 지시가 되고, 운이 나쁘면 모델이
-- 한 화면에 여러 포스터를 늘어놓는다.
--
-- 신원 참조 자리는 @사진 으로 바꿨다. 이 표시가 없으면 사진이 모델에게 가지 않는다.
--
-- 비율은 3:4. 원문이 "Strict 3:4 vertical composition" 이라고 못박았고, 위아래를
-- 정확히 반씩 나누는 구성이라 비율이 틀어지면 설계가 통째로 무너진다.
--
-- responses 경로를 쓴다. 사진에서 대표 색 넉 장을 뽑아내고, 주요 요소를 골라
-- 손그림으로 다시 그리고, 여백을 계산해 글자를 얹는 일이 전부 해석이다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'editorial-poster',
    '반은 사진, 반은 그림 포스터',
    '위쪽은 올린 사진 그대로, 아래쪽은 그 사진을 손그림으로 다시 그려요. 한 장의 아트북 표지처럼 나와요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '3:4',
    '1152x1536',
    180,
    '포스터로 만들고 싶은 사진 1장',
    '{"checklist":[
        "주인공이 분명한 사진일수록 아래쪽 그림이 잘 나와요",
        "배경이 복잡하지 않은 사진이 좋아요",
        "색이 뚜렷한 사진일수록 그림의 색이 살아나요",
        "인물, 풍경, 사물 어떤 사진이든 괜찮아요"
      ],
      "resultNote":"위쪽 사진은 색감만 다듬고 그대로 살려요. 아래쪽 그림과 글자는 매번 다르게 나와요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '사진', 'IMAGE', '사진',
       '이 사진이 위쪽에 그대로 들어가고, 아래쪽 그림도 이 사진에서 뽑아내요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'editorial-poster';

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
            'prompt', $prompt$Create one independent high-end editorial poster from @사진.

OVERALL FORMAT
Strict 3:4 vertical composition.
Divide the canvas horizontally into two exactly equal sections, with a precise 1:1 height ratio.
The top half occupies exactly 50% of the canvas. The bottom half occupies exactly 50% of the canvas.
The two sections should feel visually connected as one refined art publication cover.

TOP HALF - ORIGINAL PHOTOGRAPH
Preserve @사진 as faithfully as possible.
Keep the main composition, subjects, identity, facial features, body proportions, poses, expressions, clothing, objects, and spatial relationships unchanged.
Preserve the realistic photographic texture, natural lighting, shadows, atmosphere, and original color mood.
Apply only subtle, sophisticated editorial color grading, creating the feeling of a premium magazine photograph, contemporary art book, or high-end independent publication.
The image should remain photorealistic and authentic, never overly retouched or artificially stylized.
If necessary to fit the composition naturally, extend the sky, ground, walls, or surrounding environmental background.
Background extension must feel seamless and photographic.
Never stretch, distort, reshape, replace, or alter the main subject.

BOTTOM HALF - MINIMAL HAND-DRAWN PAPER ILLUSTRATION
Extract the most recognizable visual elements from the original photograph and reinterpret them as a minimalist hand-drawn paper-cover illustration.

Preserve:
- the most recognizable subject
- essential silhouette and proportions
- key pose or gesture
- important objects
- the core narrative relationship between people and objects

Highly simplify the image. Remove unnecessary details and retain only the visual information needed for immediate recognition.

Use:
- delicate, slightly imperfect hand-drawn lines
- a small number of bold, clearly defined acrylic-style flat color shapes
- rough paper texture
- visible handmade brush marks
- slightly irregular, organic edges
- subtle imperfections that make it feel genuinely handmade

The main illustrated subject should be small, centered, and carefully composed, occupying approximately 10-20% of the bottom half.
Leave a large amount of negative space around the illustration.
The background should primarily resemble rough white paper, warm off-white paper, pale natural paper, or minimal editorial book-cover stock.
Use only a few lines or small color shapes to suggest the surrounding environment.

COLOR PALETTE
Extract the dominant colors directly from the original photograph.
Compress the palette into no more than 4 main colors.
Keep the colors restrained, sophisticated, and harmonious.
Use bold but controlled flat color blocks. Avoid excessive color variation.
Preserve subtle paper grain and handmade brush texture.
The illustration should visually feel like a simplified color interpretation of the photograph.

TYPOGRAPHY
A small amount of simple typography may be included when appropriate:
a short title, keyword, object name, location, year, number, or short phrase.
Text should be minimal, understated, and editorial.
Typography should naturally interact with the large areas of negative space and the small illustration, evoking art book covers, independent publishing, contemporary editorial design, and thoughtful children's picture books.
Do not force text into the composition if it does not naturally fit the photograph.

VISUAL LANGUAGE
The final poster should feel quiet, poetic, refined, minimal, innocent, relaxed, artistic, thoughtful, high-recognition, and premium.
The visual concept should be: a small subject surrounded by a large amount of empty space.
The result should resemble a carefully designed independent art publication cover, rather than a commercial advertisement.

AVOID
Do not use colored-pencil aesthetics, crayon textures, bleeding watercolor, pure line-art illustration, complex realistic illustration, heavy oil-painting effects, smooth polished digital illustration, 3D rendering, glossy 3D textures, commercial cartoon aesthetics, cute commercial character design, e-commerce advertising aesthetics, generic poster templates, excessive decorative elements, busy compositions, or excessive typography.

FINAL ART DIRECTION
The top half should feel like a beautiful, authentic editorial photograph.
The bottom half should feel like a small, handmade visual poem derived from that photograph.
The two halves should clearly belong to the same visual story, while maintaining a strong contrast between photographic realism above and minimal handmade illustration below.
Prioritize recognition, restraint, negative space, material texture, subtle imperfection, editorial sophistication, and artistic storytelling over decorative complexity.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@사진', '이 사진이 위쪽에 그대로 들어가고, 아래쪽 그림도 이 사진에서 뽑아내요')
        )
    ),
    '한 단계. 여러 장 배치 전제를 한 장 기준으로 고쳐 썼다'
FROM templates t
WHERE t.slug = 'editorial-poster';
