-- ============================================================================
-- 열한 번째 템플릿: 한가위 보름달 아기
--
-- 받은 글에 @아기사진 이 이미 들어 있었다. 손댈 것이 없어 그대로 두고, 한 줄에 하나씩
-- 이어지던 지시만 문장으로 묶었다. 뺀 지시는 없다.
--
-- 비율은 3:4. 본문이 "달이 위쪽 50~60%를 차지하고, 그 아래에 작은 인형들이 절구를
-- 찧는다"고 위아래를 나눠 지시한다. 가로로 넓히면 그 층이 무너지고, 9:16 처럼 길면
-- 가운데가 비어 달과 인형이 서로 멀어진다.
--
-- 이 템플릿은 한 사진에서 두 가지를 만들어야 한다 — 달이 된 얼굴과, 그 얼굴을 한 작은
-- 인형들. 같은 아기로 보여야 뜻이 서는 구성이라, 사진이 전달되지 않으면 결과가 그냥
-- 망가지는 정도가 아니라 의미 자체가 사라진다.
--
-- 추석 템플릿이 이것으로 셋째다(풍물놀이, 한복 인사, 보름달). 셋 다 소재가 겹치지만
-- 장면은 꽤 다르다. 다만 목록에서 나란히 보이면 고르기 어려울 수 있다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'chuseok-moon-babyface',
    '한가위 보름달 아기',
    '아이 얼굴이 커다란 보름달이 되고, 그 아래에서 토끼 옷을 입은 꼬마 분신들이 절구를 찧어요.',
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
        "정면에 가까울수록 달에 얼굴이 잘 얹혀요",
        "밝은 곳에서 찍은 사진이 좋아요",
        "모자나 손으로 얼굴이 가리지 않은 사진"
      ],
      "resultNote":"달이 된 얼굴과 꼬마 분신들이 같은 아이로 나와요. 달 표면에 얼굴이 새겨지는 방식이라 매번 조금씩 다르게 나와요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아기사진', 'IMAGE', '아기사진',
       '달이 된 얼굴과 꼬마 분신들이 모두 이 사진에서 나와요. 또렷할수록 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'chuseok-moon-babyface';

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
            'prompt', $prompt$Use @아기사진 as the ONLY facial identity reference for the baby.

Create a high-resolution, premium photorealistic-meets-whimsical Korean Chuseok greeting image.

IMPORTANT FACIAL IDENTITY:
The baby's facial identity from @아기사진 must be preserved accurately - recognizable facial structure, eye shape, eye spacing, nose shape, mouth shape, cheeks, chin, forehead, skin tone, and overall facial proportions.
Do not create a generic baby face. Do not replace the baby's identity with another child.
The baby's face should remain immediately recognizable as the same baby from @아기사진.
However, the baby's face will be artistically transformed into a giant full moon.

MAIN CONCEPT:
Replace the large full moon in the composition with a gigantic glowing full moon based on the baby's face.
The moon itself should be shaped like a perfect round full moon, and the baby's face should naturally appear INSIDE and AS PART OF the moon.
The result should look like: "the baby's face has become a magical full moon."
The baby's face must NOT look like a photograph pasted onto a circular moon. Seamlessly merge the baby's facial features with the moon surface.
The moon should still clearly look like a real full moon while simultaneously preserving the baby's recognizable facial identity.

BABY FACE MOON:
Create a large circular full moon occupying the upper central portion of the image, with a soft warm ivory-yellow lunar glow, subtle golden light, realistic moon surface texture, gentle lunar craters, soft atmospheric glow around the edges, and a slightly dreamy Korean Chuseok atmosphere.

Integrate the baby's facial features naturally into the moon surface. The eyes, nose, mouth, cheeks, forehead and facial proportions should remain recognizable.
The face should appear subtly embossed into the lunar surface, with soft lunar shadows and highlights.

Do NOT make the baby face look like a flat photograph.
Do NOT create a floating human face in front of the moon.
Do NOT create a normal baby's head attached to the moon.
The moon itself IS the baby's face. The baby's facial features and the lunar surface should seamlessly blend together.
The moon should remain perfectly circular, and the baby's face should occupy most of the inner moon surface while preserving that circular silhouette.

MOON EXPRESSION:
Give the baby's moon face a gentle, innocent, peaceful expression with a subtle natural smile - warm and heartwarming, like a magical smiling Chuseok moon.
Do not exaggerate the smile. Do not change the baby's fundamental facial identity.

MINI BABY CHARACTERS:
At the bottom center of the scene, create 2 to 3 tiny 3D SD mini-me characters based on the SAME baby's facial identity from @아기사진 - miniature versions of the baby that look like tiny 3D toy versions.

Each mini-me should have a large head and small body (2 to 3 head-to-body proportions), a round soft baby face, cute sparkling eyes, small hands and feet, an adorable 3D toy appearance, and soft rounded proportions.
They must preserve the recognizable facial identity of @아기사진 and clearly look like miniature versions of the baby whose face appears in the moon.

RABBIT COSTUME:
Dress all mini-me characters in adorable traditional Korean Chuseok-inspired rabbit costumes - a cute white rabbit outfit with a soft white rabbit hood or rabbit ears, a fluffy white body, small rounded shape, and soft cream and white colors, looking like a premium collectible 3D toy costume.

The baby's face must remain visible. Do not cover the entire face with the rabbit hood.
Avoid cartoon exaggeration. Keep the mini-me characters cute, premium, and slightly realistic.

MINI-ME ACTION:
The mini-me characters are gathered around a traditional Korean stone mortar and pestle, happily pounding it during Chuseok.
One mini-me holds the pestle with both hands, another helps hold or guide it, and a third (if used) stands beside the mortar cheering or preparing rice cakes.
They should look like they are genuinely interacting with the mortar - natural physical interaction, correct hand placement, realistic contact between pestle and mortar, playful and heartwarming expressions.
The scene should feel like tiny baby versions of themselves are celebrating Chuseok together.

MORTAR:
A traditional Korean stone mortar in dark reddish-brown or warm wooden-stone texture, appropriately sized relative to the tiny mini-me characters and large enough for them to interact with naturally.
Inside the mortar, subtle traditional Korean rice cake preparation elements may be visible. Do not overcrowd it.

MINI-ME SCALE:
The mini-me characters should be approximately palm-sized - tiny compared with the giant moon, yet large enough to clearly see their faces and rabbit costumes.
Create a strong visual scale contrast: the giant baby-face moon, then the tiny palm-sized mini-me characters, then the traditional Korean mortar. This contrast is an important part of the composition.

BACKGROUND:
A magical Korean Chuseok night - a traditional hanok village silhouette in the distance, dark blue evening sky, subtle stars, soft clouds, traditional tiled Korean rooftops, distant mountains, and warm subtle lights from traditional Korean houses. Peaceful autumn night atmosphere.
The giant baby-face moon should be the dominant light source, casting a soft warm golden glow onto the mini-me characters and the mortar.

COMPOSITION:
Large baby-face full moon in the upper center, occupying approximately the upper 50-60% of the image.
Tiny rabbit-costumed baby mini-me characters in the lower center, with the traditional mortar positioned between them.
Balanced symmetrical composition with strong visual hierarchy.
Leave some clean space around the moon for Korean greeting typography.
The overall composition should resemble a premium Korean Chuseok greeting-card illustration.

LIGHTING:
The giant moon provides warm golden illumination, with soft rim light around the mini-me characters, gentle moonlight on the rabbit costumes, subtle shadows beneath them, and realistic contact shadows around the mortar.
Soft atmospheric glow, cinematic nighttime lighting, warm moonlight contrasting against the deep blue night sky.

TEXT:
Place elegant traditional Korean calligraphy near the upper portion of the composition, spelled exactly:
풍요로운 한가위 되세요
Use authentic Korean brush calligraphy in warm dark brown or deep golden-brown ink, with traditional brush texture and natural brushstroke variation - an elegant and festive Chuseok greeting-card aesthetic. The text must be clearly readable.
Do not add any other text - no logo, no signature, no additional Korean writing, no random characters, no decorative typography.

VISUAL STYLE:
Premium 3D cinematic illustration - photorealistic baby facial identity combined with stylized 3D toy mini-me characters.
The mini-me characters should have soft realistic materials, subtle skin texture, smooth 3D toy-like surfaces, beautiful cinematic lighting, premium collectible figure quality, and cute Korean character design.
The overall style should feel like a Korean Chuseok greeting card meets a premium 3D character advertisement, set in a magical moonlit Korean night.
Avoid cheap cartoon aesthetics, flat 2D illustration, generic AI character design, and overly exaggerated Pixar-like facial features.

FACIAL IDENTITY PRIORITY:
The giant moon face and the tiny mini-me faces must be based on the SAME baby's facial identity from @아기사진.
The giant moon represents the baby's face; the mini-me characters represent tiny versions of the same baby.
The viewer should immediately understand: "That giant moon is the baby's face, and those tiny rabbit characters are little versions of the same baby."
Do not create different children. Do not change the baby's identity. Do not create generic Korean baby faces.

FINAL RESULT:
A magical and heartwarming Korean Chuseok night scene. A gigantic glowing full moon containing the recognizable baby's face watches over the scene. Below it, tiny palm-sized 3D mini-me versions of the same baby, dressed in adorable white rabbit costumes, happily pound a traditional Korean mortar together.
Festive, cute, magical, warm, nostalgic, and premium. High resolution, ultra detailed, cinematic lighting, beautiful depth, premium 3D rendering, professional Korean Chuseok greeting-card quality.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아기사진', '달이 된 얼굴과 꼬마 분신들이 모두 이 사진에서 나와요')
        )
    ),
    '한 단계. 한 사진에서 달 얼굴과 꼬마 인형을 함께 만들어야 해 해석량이 많다'
FROM templates t
WHERE t.slug = 'chuseok-moon-babyface';
