-- ============================================================================
-- 열 번째 템플릿: 한가위 한복 인사
--
-- 앞의 둘과 같은 처리다. 신원 참조를 말하는 자리를 @아기사진 으로 바꿨다. 이 글도 절반이
-- "같은 아기여야 한다"는 당부라, 표시가 없어 사진이 안 가면 그 절반이 통째로 헛돈다.
--
-- 반복되던 한 줄짜리 지시들은 문장으로 묶었다. 뺀 지시는 없다.
--
-- 비율은 3:4. 전신이 다 나와야 하고 위쪽에 '풍성한 한가위 되세요~' 붓글씨 자리를 비워
-- 두라고 본문이 요구한다. 정사각형이면 둘 중 하나를 포기해야 한다.
--
-- 추석 풍물놀이(chuseok-pungmul)와 소재가 겹친다. 그쪽은 꽹과리를 치는 활동적인 장면이고
-- 이쪽은 한복을 입고 앉아 인사하는 정적인 장면이라 결과가 꽤 다르게 나올 것이다.
-- 둘 다 두되, 목록에서 나란히 보면 헷갈릴 수 있다는 점은 염두에 둘 것.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'chuseok-hanbok-greeting',
    '한가위 한복 인사',
    '아이에게 한복을 입히고 한옥 마당에 앉혀 인사하는 모습으로 만들어요. 위에는 풍성한 한가위 되세요 붓글씨가 들어가요.',
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
        "정면에 가까울수록 얼굴이 잘 지켜져요",
        "밝은 곳에서 찍은 사진이 좋아요",
        "모자나 손으로 얼굴이 가리지 않은 사진"
      ],
      "resultNote":"한복과 배경, 소품은 새로 만들어져요. 아이의 얼굴과 생김새는 그대로 살려요. 한복은 사진 속 아이에 맞춰 골라져요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아기사진', 'IMAGE', '아기사진',
       '얼굴을 그대로 살리는 템플릿이라 또렷하게 나온 사진일수록 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'chuseok-hanbok-greeting';

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
            'prompt', $prompt$Use @아기사진 as the ONLY facial identity reference.
Preserve the baby's recognizable identity, facial structure, eye shape, skin tone, hairstyle, and overall facial proportions from @아기사진.
The generated result must look like the same real baby, not a different child.

Create a high-resolution, photorealistic premium Korean baby studio portrait with ultra-natural professional baby photography quality.

SUBTLE ENHANCEMENT REQUIREMENTS:
Slightly rounder cheeks, brighter sparkling eyes, a smoother forehead with no forehead wrinkles, softer baby skin texture, a gentle innocent expression, a natural bright smile, and adorable but realistic baby proportions.
Retain natural skin texture. No plastic skin, no cartoon effect, no exaggerated AI beauty filters, no unrealistic facial reshaping.

IMPORTANT:
Only the baby's face and natural identity should change depending on @아기사진.
Everything else - composition, styling, outfit, props, text placement, lighting, colors, camera angle, background, and overall aesthetic - must remain consistent across generations.
The baby's gender and natural appearance should be respected based on the reference photo.
Do not feminize a male baby. Do not masculinize a female baby. Do not alter the baby's natural identity or gender characteristics.

SCENE CONCEPT:
A warm and elegant Korean Chuseok themed premium baby studio portrait.
The image should capture the warm, peaceful, nostalgic atmosphere of a traditional Korean autumn holiday, celebrating family, gratitude, togetherness, and a joyful Chuseok greeting.

COMPOSITION:
Centered symmetrical framing with the full body visible in frame.
The baby is seated naturally at the center, facing directly toward the camera, smiling brightly and naturally, with both hands gently placed together in front of the body in a cute and respectful traditional Korean greeting pose.
Focus primarily on the baby. Clean elegant composition, luxury professional Korean baby photoshoot aesthetic, warm traditional holiday greeting-card mood.
Leave balanced empty space for typography. Keep the traditional Korean styling minimal but authentic.

BABY POSE:
The baby is seated naturally in the center of the frame, facing the camera with a bright, innocent, heartwarming smile.
Both hands are gently brought together in front of the body, as if politely greeting family members during Chuseok.
The pose should feel natural and age-appropriate for a real baby.
Do not make the hands unnaturally stiff or perfectly symmetrical.
Maintain realistic baby posture, natural body proportions, natural hand anatomy, and authentic baby behavior.
The baby should look comfortable, relaxed, cheerful, and naturally adorable.

OUTFIT:
A traditional Korean baby hanbok of elegant and authentic design, in soft pastel and warm autumn-inspired colors, made of premium traditional Korean fabric with delicate embroidered details and subtle traditional patterns. Clean, sophisticated, luxury baby hanbok photography aesthetic.

For a male baby: traditional jeogori with matching baji in soft ivory, cream, muted blue, pale gray, or subtle pastel blue tones; a small traditional Korean baby hat or durumagi-inspired styling if appropriate.
For a female baby: traditional jeogori with matching chima in soft ivory, cream, blush pink, pale peach, muted lavender, or subtle pastel tones; a small traditional Korean baby headpiece if appropriate.

Select the gender-appropriate hanbok naturally based on the reference photo.
The hanbok must look authentic, elegant, luxurious, and age-appropriate.
Avoid overly ornate or theatrical costumes, fantasy elements, cartoon-like styling, and modern clothing.

BACKGROUND:
A beautiful traditional Korean hanok courtyard - traditional wooden architecture, warm natural wooden textures, a tiled roof visible in the background, wooden doors and windows, subtle autumn foliage, warm muted autumn colors, soft natural sunlight, and a peaceful nostalgic atmosphere.
Keep the hanok background slightly out of focus so the baby remains the primary subject.
It should feel like a real traditional Korean hanok courtyard in early autumn.
Avoid modern buildings, modern furniture, Western architecture, cluttered decorations, excessive traditional props, and fantasy scenery.

PROPS:
Minimal traditional Korean Chuseok elements: a small traditional wooden tray, a few beautifully arranged songpyeon, a small traditional Korean gift wrapped in bojagi, a few softly scattered autumn leaves, and subtle traditional decorative elements.
Keep the props minimal, elegant, and naturally arranged. The baby must remain the clear focal point.
Do not overcrowd the scene with food or decorations. Do not place props directly in front of the baby's face or body.

TEXT LAYOUT:
At the top center, place large traditional Korean calligraphy-style text, arranged horizontally in one centered line, spelled exactly:
풍성한 한가위 되세요~
Use elegant traditional Korean brush calligraphy in warm dark brown ink, with authentic brush texture, slightly organic ink variation, and graceful strokes - a warm and festive Chuseok greeting-card aesthetic.
It should feel like authentic Korean calligraphy written with a brush, not a modern digital font.
Do not change the wording. Do not add any additional Korean text anywhere - no names, signatures, additional greetings, postal marks, stamps, logos, random Korean characters, or random typography.

LIGHTING & COLOR:
Soft natural daylight and warm autumn sunlight with gentle natural shadows.
Creamy pastel color palette with subtle autumn tones and natural skin tones.
Ultra-detailed realistic skin texture, realistic hanbok fabric texture, realistic wooden architecture texture.
Soft cinematic depth of field, natural lens depth, subtle background bokeh, warm nostalgic Chuseok atmosphere.

CAMERA & PHOTOGRAPHY:
Professional full-frame camera with a premium portrait lens, natural perspective, sharp focus on the baby, shallow depth of field, softly blurred hanok background, realistic optical bokeh, natural skin rendering, high dynamic range, ultra-high resolution, 8K-quality detail.
Position the camera approximately at the baby's eye level.
Avoid exaggerated wide-angle distortion. Keep the baby's facial proportions natural and realistic.

FINAL STYLE:
A photorealistic premium Korean baby studio portrait - elegant, warm, traditional, nostalgic, peaceful, joyful, and heartwarming.
The final image should feel like a professionally photographed Korean Chuseok greeting-card portrait featuring the same real baby from the reference photo, wearing an authentic gender-appropriate hanbok in a beautiful hanok setting.
It should look like a real professional baby photoshoot, not AI-generated.
No cartoon effect, no fantasy atmosphere, no excessive beauty retouching, no artificial plastic skin, no exaggerated facial features, no distorted hands, no extra fingers, no malformed anatomy, no unnatural body proportions, no unnecessary decorations, no modern objects, no additional text.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아기사진', '얼굴을 그대로 살리는 템플릿이라 또렷하게 나온 사진일수록 좋아요')
        )
    ),
    '한 단계. 붓글씨와 한복 선택 해석이 필요해 responses 경로를 쓴다'
FROM templates t
WHERE t.slug = 'chuseok-hanbok-greeting';
