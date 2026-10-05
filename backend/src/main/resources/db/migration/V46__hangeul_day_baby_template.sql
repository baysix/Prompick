-- ============================================================================
-- 한글날 아기 삼형제
--
-- 받은 글은 "이미 있는 그림의 빈 현판에 한·글·날만 얹어라"는 편집 지시다. 바탕이 되는
-- 그림 - 세 아기, 조선시대 복식, 가운데 아이의 세종대왕 차림, 빈 현판 셋 - 은 그 글 안에
-- "이것들을 절대 바꾸지 마라"는 목록으로만 적혀 있었다. 그래서 그 목록을 거꾸로 읽어
-- 1단계를 지었다. 2단계는 받은 글 그대로이고 한 글자도 고치지 않았다.
--
-- 왜 두 단계로 나누는가.
--
-- 한 번에 그리게 하면 한글이 거의 반드시 무너진다. 모델은 글자를 쓰는 것이 아니라 글자처럼
-- 보이는 모양을 그리기 때문이다. 세 글자를 세 자리에 정확히 넣어야 하는데 한 글자만
-- 어긋나도 "한글날"이 아니게 되고, 하필 한글날 템플릿에서 그러면 안 된다.
--
-- 먼저 현판을 비워둔 채 장면을 완성하고 다음 단계에서 그 그림을 바탕으로 글자만 얹으면,
-- 모델이 신경 쓸 것이 글자 하나뿐이라 훨씬 잘 버틴다. 입력 그림이 있으면 OpenAI 쪽을
-- edit 으로 부르므로(OpenAiImageProvider) 바탕을 지키려는 성질도 함께 생긴다.
--
-- 1단계에서 현판을 반드시 비우라고 거듭 적은 이유도 같다. 비워두라고 말하지 않으면 한글처럼
-- 생긴 가짜 글자를 채워 넣고, 그러면 2단계가 그것을 지우는 일부터 해야 한다.
--
-- 비율은 1:1. 아기 셋과 현판 셋이 가로로 늘어서는 구성이라 세로로 길면 얼굴이 작아지고,
-- 16:9(2080x960)는 높이가 960뿐이라 얼굴이 뭉개진다. 1536x1536이 셋을 나란히 두면서
-- 얼굴에 가장 많은 화소를 준다.
--
-- 두 단계라 한 번 만들 때 요금이 두 번 나간다. estimated_seconds 를 240으로 둔 것도
-- 그래서다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'hangeul-day-baby',
    '한글날 아기 삼형제',
    '우리 아이가 셋으로 늘어나 조선시대 옷을 입고, 가운데 아이는 세종대왕 차림으로 현판에 한글날을 적어요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '1:1',
    '1536x1536',
    240,
    '아이 얼굴이 또렷한 사진 1장',
    '{"checklist":[
        "얼굴이 크고 또렷하게 나온 사진",
        "정면에 가까울수록 세 아이가 모두 닮게 나와요",
        "밝은 곳에서 찍은 사진이 좋아요",
        "모자나 손으로 얼굴이 가리지 않은 사진"
      ],
      "resultNote":"한 사진에서 세 아이가 모두 나와요. 현판의 글자는 그림을 다 그린 뒤 따로 얹는 방식이라, 한 번에 그리는 것보다 또렷하게 나와요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아기사진', 'IMAGE', '아기사진',
       '세 아이가 모두 이 사진에서 나와요. 또렷할수록 셋이 같은 아이로 보여요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'hangeul-day-baby';

INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT
    t.id,
    1,
    TRUE,
    jsonb_build_array(
        -- 1단계: 현판을 비워둔 채 장면을 완성한다
        jsonb_build_object(
            'type', 'GENERATE_IMAGE',
            'modelId', (SELECT id FROM ai_models
                         WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2.5-sunburst'),
            'prompt', $step1$Use @아기사진 as the ONLY facial identity reference for all three babies.

Create a high-resolution, premium 3D illustration celebrating Hangeul Day (한글날), the Korean alphabet holiday.

FACIAL IDENTITY — HIGHEST PRIORITY:
All three babies must share the SAME facial identity taken from @아기사진 — the same facial structure, eye shape, eye spacing, nose shape, mouth shape, cheeks, jawline, skin tone and overall facial proportions.
They are three versions of ONE baby, not three different children.
Do not create generic baby faces. Do not replace the identity with another child. The viewer should immediately recognise all three as the same baby.
Keep each face gentle, bright and naturally cute, with soft innocent expressions and a subtle warm smile.

COMPOSITION:
Three babies standing side by side in a single row, facing the viewer, evenly spaced and centred in a square frame.
Each baby holds up one rectangular wooden signboard in front of their chest with both hands, at roughly the same height, so the three signboards form a clean horizontal line across the middle of the image.
Balanced symmetrical composition. All three faces clearly visible above their signboards. Full upper bodies visible.

THE CENTER BABY — KING SEJONG INSPIRED:
Dress the middle baby in a cute, baby-proportioned version of King Sejong's royal attire — a deep crimson-red royal robe (곤룡포) with golden dragon embroidery on the chest, wide sleeves, and a small black royal headpiece (익선관) sized for a baby's head.
Keep it adorable and toy-like rather than historically severe. The headpiece must not cover the face.

THE LEFT AND RIGHT BABIES — JOSEON SCHOLAR ATTIRE:
Dress the left baby in a soft indigo-blue traditional Joseon-era scholar's robe with a white collar, and the right baby in a warm ivory-cream Joseon-era robe with a pale jade sash.
Both wear small traditional Korean hats appropriate for children, worn slightly back so the forehead and face stay fully visible.
The three outfits should clearly belong to the same Joseon-era world while being distinguishable from one another.

THE THREE SIGNBOARDS — MUST BE COMPLETELY BLANK:
Each baby holds a rectangular traditional Korean signboard with a dark carved wooden frame and a clean Hanji paper surface inside.
All three signboards are identical in size, shape and style, held at the same angle, facing the viewer almost straight on.

THE HANJI PAPER SURFACE MUST BE ENTIRELY EMPTY.
Absolutely no writing of any kind on the signboards — no Korean characters, no Hangul, no Chinese characters, no Japanese characters, no letters, no numbers, no symbols, no decorative marks, no faint strokes, no watermarks, no texture that resembles writing.
The paper should show only its natural warm ivory Hanji fibre texture.
This is essential: the writing will be added in a later step, and anything written now would have to be erased.

BACKGROUND:
A warm traditional Korean setting — a hanok courtyard with wooden pillars and latticed paper doors softly blurred behind the babies, gentle autumn daylight, a hint of a tiled roofline above, and subtle warm earth tones.
Keep the background softly out of focus so the babies and the blank signboards stay dominant. Do not place any text, banner, scroll or written sign anywhere in the background.

LIGHTING:
Soft warm natural daylight from the front, gentle fill light on the faces, subtle contact shadows beneath the babies, a light warm rim glow separating them from the background.
Even illumination across all three signboards so the paper surfaces read clearly and evenly.

VISUAL STYLE:
Premium 3D cinematic illustration — photorealistic baby facial identity combined with smooth stylised 3D character rendering.
Soft realistic skin texture, fine fabric detail on the traditional robes, believable wood grain and paper fibre, beautiful cinematic lighting, premium collectible-figure quality.
Avoid cheap cartoon aesthetics, flat 2D illustration, generic AI character design, and overly exaggerated Pixar-like facial features.

NO TEXT ANYWHERE:
Do not add any text, title, caption, signature, logo, date, Korean writing, pseudo-Hangul, decorative lettering, symbols or watermarks anywhere in the image — not on the signboards, not on the clothing, not in the background.
The entire image must be completely free of written characters.

FINAL RESULT:
Three identical-faced babies in Joseon-era attire standing in a row in a warm hanok courtyard, the middle one dressed as a tiny King Sejong, each holding up a beautiful but completely blank wooden-framed Hanji signboard.
High resolution, ultra detailed, cinematic lighting, premium 3D rendering, warm and heartwarming Korean holiday greeting-card quality.$step1$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '1:1',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아기사진', '세 아이가 모두 이 사진에서 나와요')
        ),
        -- 2단계: 빈 현판에 한·글·날만 얹는다. 받은 글 그대로다
        jsonb_build_object(
            'type', 'GENERATE_IMAGE',
            'modelId', (SELECT id FROM ai_models
                         WHERE provider = 'OPENAI' AND model_key = 'gpt-image-2.5-sunburst'),
            'prompt', $step2$EDIT THE EXISTING IMAGE ONLY.

Use the existing generated image as the base image.

IMPORTANT:
Do NOT regenerate the image from scratch.

Preserve the existing image exactly as much as possible.

The ONLY change allowed is adding Korean text to the three existing blank signboards.

==================================================
PRESERVE EVERYTHING ELSE
==================================================

ABSOLUTELY PRESERVE:

the three babies
their facial identities
their facial structures
their eye shapes
their eye spacing
their noses
their mouths
their cheeks
their jawlines
their skin tones
their facial expressions
their hairstyles
their body proportions
their poses
their hand positions
their clothing
their Joseon-era outfits
the center baby's King Sejong-inspired styling
the left baby's styling
the right baby's styling
the three signboards themselves
the signboard positions
the signboard sizes
the signboard shapes
the signboard borders
the signboard paper texture
the background
the traditional Korean environment
the composition
the camera angle
the framing
the lighting
the shadows
the colors
the depth of field
the overall 3D illustration style
the image quality

DO NOT change, redraw, replace, beautify, reinterpret, or regenerate any of these elements.

The existing babies must remain exactly the same babies.

Do not modify their faces or expressions.

Do not change their clothes.

Do not change the composition.

Do not move the characters.

Do not move the signboards.

==================================================
ONLY MODIFY THE SIGNBOARD TEXT
==================================================

There are THREE existing blank signboards.

Add exactly ONE Korean syllable to each signboard.

The required text is:

LEFT SIGNBOARD:
"한"

CENTER SIGNBOARD:
"글"

RIGHT SIGNBOARD:
"날"

Therefore, when reading the three signboards from LEFT to RIGHT, they must read:

"한  글  날"

This exact Korean phrase is the ONLY text that should appear on the three signboards.

==================================================
TEXT ACCURACY — EXTREMELY IMPORTANT
==================================================

The Korean characters MUST be exactly:

한
글
날

Do not change the characters.

Do not substitute similar-looking characters.

Do not generate random Korean characters.

Do not generate pseudo-Korean writing.

Do not generate Chinese characters.

Do not generate Japanese characters.

Do not add extra strokes.

Do not remove strokes.

Do not distort the syllables.

Do not mirror the characters.

Do not rotate the characters.

Do not add additional letters.

Each signboard must contain EXACTLY ONE Korean syllable.

LEFT = 한

CENTER = 글

RIGHT = 날

The three characters together must clearly read:

한글날

==================================================
TYPOGRAPHY
==================================================

Use a traditional Korean brush-calligraphy style.

Large bold black Korean brush lettering.

Natural traditional brushstroke texture.

Slightly organic ink variation.

Handwritten Korean calligraphy appearance.

Elegant and culturally authentic.

The text should look naturally handwritten with a traditional Korean calligraphy brush.

Do NOT use a modern computer font.

Do NOT use decorative Western typography.

Do NOT add shadows or effects that make the Korean characters difficult to read.

==================================================
TEXT POSITION
==================================================

Place each syllable in the CENTER of its existing signboard.

Keep the Korean character large and clearly readable.

Maintain comfortable margins around each character.

Do not touch the borders.

Do not overlap the signboard edges.

Do not change the size or position of the signboards themselves.

Only place the text naturally onto the existing paper surface.

==================================================
PERSPECTIVE AND MATERIAL
==================================================

The Korean characters must follow the perspective and surface angle of each existing signboard.

The brush lettering should appear physically written on the Hanji paper.

Match the existing lighting.

Match the existing shadows.

Match the existing paper texture.

The text must look naturally integrated into the original image, not digitally pasted on.

==================================================
NO OTHER CHANGES
==================================================

Do NOT add any other text anywhere in the image.

Do NOT add:

titles
subtitles
captions
names
signatures
logos
dates
additional Korean words
random Hangul
decorative letters
symbols
watermarks

Do NOT modify the background.

Do NOT modify the babies.

Do NOT modify the clothes.

Do NOT modify the props.

Do NOT modify the lighting.

Do NOT modify the colors.

Do NOT modify the composition.

Do NOT regenerate any part of the image unnecessarily.

==================================================
FINAL REQUIREMENT
==================================================

The final image must be visually identical to the existing image except for one modification:

The three previously blank signboards now contain:

LEFT: 한
CENTER: 글
RIGHT: 날

Reading from left to right:

한 | 글 | 날

Nothing else should change.$step2$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '1:1',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@바탕그림', 'steps[0].output')
        )
    ),
    '두 단계. 1단계가 현판을 비운 채 장면을 만들고 2단계가 한·글·날만 얹는다. 한 번에 그리면 한글이 무너져서 나눴다. 요금은 두 번 나간다'
FROM templates t
WHERE t.slug = 'hangeul-day-baby';
