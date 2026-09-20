-- ============================================================================
-- 여덟 번째 템플릿: 추석 풍물놀이 아기
--
-- 받은 글은 얼굴을 지키라는 지시가 절반이다. 그만큼 사진이 실제로 모델에 전달되는지가
-- 이 템플릿의 전부다. 그래서 신원 참조를 말하는 자리를 @아기사진 으로 바꿨다.
-- 이 표시가 없으면 사진은 첨부돼도 모델에게 가지 않고, "같은 아기"를 그토록 여러 번
-- 당부한 글이 통째로 헛돈다. 실패가 조용해서 더 나쁘다.
--
-- 나머지는 뜻을 바꾸지 않는 선에서 줄만 묶었다. 같은 지시가 한 줄에 하나씩 이어지던
-- 것을 항목으로 합쳤을 뿐, 뺀 지시는 없다.
--
-- 비율은 3:4. 위쪽에 '풍요로운 한가위 되세요' 붓글씨가 들어갈 여백이 필요하고
-- 아기 전신이 다 나와야 해서 정사각형은 좁다.
--
-- responses 경로를 쓴다. 한글 붓글씨를 그림 안에 써야 하고, 배경의 풍물패를 흐리게
-- 두면서 아기를 주인공으로 지켜야 해서 해석할 것이 많다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'chuseok-pungmul',
    '추석 풍물놀이 아기',
    '아이에게 꼬마 풍물패 옷을 입히고 꽹과리를 쥐여줘요. 위에는 풍요로운 한가위 되세요 붓글씨가 들어가요.',
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
      "resultNote":"옷과 배경, 상모와 꽹과리는 새로 만들어져요. 아이의 얼굴과 생김새는 그대로 살려요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아기사진', 'IMAGE', '아기사진',
       '얼굴을 그대로 살리는 템플릿이라 또렷하게 나온 사진일수록 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'chuseok-pungmul';

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
            'prompt', $prompt$Use @아기사진 as the ONLY and PRIMARY facial identity reference.

CRITICAL FACIAL IDENTITY REQUIREMENT:
The baby in the generated image MUST be unmistakably the same real baby shown in @아기사진.
Do NOT redesign, reinterpret, replace, beautify, or regenerate the baby's face.
Preserve the original baby's exact facial identity and facial geometry from the reference image.

Preserve as closely as possible:
- exact overall face shape
- forehead shape and height
- natural hairline
- eyebrow shape and natural position
- exact eye shape, eye size, eye spacing, distance between the eyes
- eyelid shape, iris position, natural gaze
- nose bridge shape, nose width, nose tip shape, nostril shape
- distance between nose and mouth
- mouth width, upper and lower lip proportions, natural lip shape
- cheek volume, cheek contour
- jawline, chin shape
- ear position and shape
- facial proportions
- relative size and position of every major facial feature

The face should maintain the same recognizable facial landmarks and proportions as the reference.
The generated baby should immediately be recognizable as the same baby even if the outfit, pose, lighting, environment, and camera composition are completely different.

DO NOT create a generic Korean baby.
DO NOT create a similar-looking baby.
DO NOT substitute another baby's face.
DO NOT change the baby's facial proportions to make the baby look more traditionally beautiful.
DO NOT make the eyes larger than the reference.
DO NOT change the nose shape.
DO NOT change the mouth shape.
DO NOT sharpen or slim the jawline.
DO NOT significantly increase cheek size.
DO NOT alter the natural forehead shape.
DO NOT alter the baby's natural facial asymmetry.

The reference photo is the absolute identity reference.
Only the environment, clothing, props, pose, lighting, and background may change.
The baby's face must remain faithful to the reference photo.

FACIAL EXPRESSION:
Create a cute, joyful, naturally excited baby expression while preserving the original facial structure.
A small natural smile or delighted expression is acceptable.
Do not force an exaggerated smile. Do not distort the cheeks or mouth.
The expression may change naturally, but the underlying facial identity must remain unchanged.

SKIN:
Preserve the baby's natural skin tone and realistic skin texture from the reference.
Natural variation caused by different lighting is acceptable.
Do not artificially whiten the skin. Do not excessively smooth the skin.
Do not apply beauty filters. Do not create plastic-looking skin.
Do not make the baby's face look airbrushed.
Keep realistic baby skin texture, subtle pores, natural softness, and authentic complexion.

SCENE CONCEPT:
A heartwarming and adorable Korean traditional Pungmul-nori themed baby portrait.
The baby is dressed as a tiny traditional Korean Pungmul performer and is joyfully playing a small traditional Korean kkwaenggwari.
The overall image should feel like a premium Korean traditional festival photograph featuring the same real baby from the reference photo.
Cute, joyful, festive, traditional, warm, and photorealistic.

BABY OUTFIT:
Dress the baby in an authentic but adorable miniature Korean Pungmul-nori performance costume.
Colorful traditional Korean performance vest and outfit with traditional decorative fabric patterns.
Subtle red, blue, yellow, white, and green traditional Korean colors.
The clothing should look authentic and professionally made, age-appropriate and comfortable for a baby.
Do not make the costume theatrical or fantasy-like. Do not make the baby look like an adult performer.
The baby should clearly remain a real Korean baby wearing a miniature traditional Pungmul costume.

SANGMO:
Place a traditional Korean Pungmul sangmo on the baby's head, appropriately sized for the baby.
A traditional white Pungmul hat with a long decorative ribbon extending naturally from the top.
The ribbon should curve and flow naturally through the air. The sangmo should look physically realistic.
The hat must NOT cover or obscure the baby's face. Keep the entire face clearly visible.
Do not let the ribbon cross the baby's eyes, nose, or mouth.

BABY POSE:
The baby is sitting naturally and comfortably, holding a small traditional Korean kkwaenggwari.
One hand naturally holds the kkwaenggwari, the other holds the small traditional wooden beater.
Capture the exact moment of the baby happily striking the instrument.
The pose should look spontaneous and adorable rather than perfectly choreographed.
Natural baby posture, natural baby arms and hands, realistic baby hand anatomy.
Correct number of fingers. No distorted hands. No extra fingers. No missing fingers.
The kkwaenggwari should be appropriately scaled for a baby.

INSTRUMENT:
A small authentic Korean brass kkwaenggwari, a traditional circular Korean percussion instrument.
Realistic metallic brass texture, warm golden-bronze surface, small wooden beater.
The instrument should be clearly visible but must not cover the baby's face.

BACKGROUND:
A lively traditional Korean Pungmul-nori performance scene in a Korean traditional village courtyard or hanok village.
Several traditional Korean Pungmul performers are performing in the background, playing janggu, buk, kkwaenggwari and other traditional percussion instruments; some perform with traditional ribbons.
Background performers should be slightly out of focus and must never be more visually prominent than the baby.
Traditional Korean hanok architecture, warm wooden structures, traditional tiled roofs, open Korean courtyard.
Festive Korean autumn atmosphere with subtle autumn foliage and warm golden afternoon sunlight.
The background should feel like a real Korean traditional festival rather than a staged fantasy scene.

TEXT:
Place large traditional Korean brush calligraphy at the top center, written exactly as:
풍요로운 한가위 되세요
Elegant traditional Korean brush calligraphy in warm dark brown or deep red ink.
Authentic Korean brush texture, traditional handwritten appearance, natural brushstroke variation.
Elegant and festive Chuseok greeting-card aesthetic. The text should be clearly readable.
Do not add any other text. Do not add names, signatures, logos, random Korean characters, or decorative typography.

COMPOSITION:
Premium Korean baby photography. The baby is the central hero subject.
Medium-full body portrait with the entire baby visible, centered composition.
Baby's face clearly visible and unobstructed. The kkwaenggwari visible near the baby's body.
The sangmo and ribbon clearly visible. Background performers arranged naturally around the baby.
Balanced visual hierarchy. Large enough clean space at the top for the Korean calligraphy.

LIGHTING:
Warm natural Korean autumn afternoon sunlight, soft and directional.
Natural highlights on the baby's face, soft realistic shadows, warm cinematic atmosphere, natural skin rendering.
Do not overexpose the baby's face. Do not dramatically change the baby's skin color.

CAMERA:
Professional full-frame camera with a premium portrait lens, natural perspective.
Camera positioned approximately at the baby's eye level. Sharp focus on the baby's face.
Very detailed facial rendering, natural optical depth of field, realistic lens bokeh, high dynamic range.

PHOTOREALISM:
The final image must look like a real professional photograph of the same baby wearing a traditional Korean Pungmul costume.
Realistic baby skin, facial anatomy, hands, fabric, metallic kkwaenggwari, sangmo, Korean architecture and lighting.
No CGI appearance. No 3D rendering. No cartoon. No illustration. No anime. No fantasy character design. No artificial AI beauty effect.

IDENTITY LOCK:
@아기사진 has priority over every other instruction regarding the baby's face.
If there is any conflict between the desired artistic style and the baby's original facial appearance, ALWAYS preserve the baby's original facial appearance.
Change the costume, the pose, the background, the lighting, the environment, and the expression naturally - BUT DO NOT CHANGE THE BABY'S IDENTITY.
The final result must look like the exact same baby from the reference photograph, photographed at a traditional Korean Pungmul-nori festival while wearing a miniature Pungmul costume and playing a kkwaenggwari.
Not a different baby. Not a similar baby. The same baby.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아기사진', '얼굴을 그대로 살리는 템플릿이라 또렷하게 나온 사진일수록 좋아요')
        )
    ),
    '한 단계. 얼굴 보존이 핵심이라 신원 참조 자리를 @아기사진 으로 바꿨다'
FROM templates t
WHERE t.slug = 'chuseok-pungmul';
