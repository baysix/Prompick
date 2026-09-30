-- ============================================================================
-- 첫 영상 템플릿: Higgsfield Genjutsu
--
-- 지금까지의 템플릿과 동작이 다르다. 이미지 템플릿은 사진 한 장에서 그림을 새로 그렸다.
-- Genjutsu 는 <이미 찍힌 영상>을 받아 그 안의 일부만 갈아 끼운다. 움직임·카메라·조명은
-- 영상이 들고 있으므로 프롬프트가 다시 말할 이유가 없고, 말하면 오히려 싸운다.
--
-- 그래서 레퍼런스 영상은 사용자가 아니라 <템플릿>이 가진다. 관리자가 등록할 때 한 번 올리고,
-- 사용자는 바꿔 넣을 사진만 올린다. 이렇게 두면 원가가 템플릿마다 고정된다 — 이 제공사는
-- 결과가 아니라 입력 영상의 길이로 요금을 매기기 때문이다.
--
-- 같은 영상이 두 군데서 쓰인다. storage_key 는 Genjutsu 에 보낼 원본이고, preview_key 는
-- 메인 목록에서 자동재생할 95KB 짜리다. 원본을 목록에서 틀면 타일 하나에 19MB 가 나간다.
--
-- 조건줄(?@이름 / !@이름)을 쓴다. 사진 칸이 셋인데 하나만 올려도 되어야 하고, 올리지 않은
-- 칸을 말하는 문장이 남으면 모델이 있지도 않은 사진을 찾다가 엉뚱한 것을 지어낸다.
-- ============================================================================

-- Genjutsu 모델. 엔드포인트 경로를 model_key 로 둔다 — 어댑터가 이 값을 그대로 부르므로
-- 오브젝트 스왑이나 다음 버전으로 옮길 때 코드를 고치지 않아도 된다.
INSERT INTO ai_models
    (provider, model_key, display_name, capability, unit_cost_krw, param_schema, active, sort_order, memo)
VALUES (
    'HIGGSFIELD',
    'higgsfiled/genjutsu/motion-transfer/v1.0',
    'Genjutsu 모션 트랜스퍼',
    'VIDEO',
    14200,
    '{"resolution":{"type":"select","options":["480p","720p"]}}'::jsonb,
    TRUE,
    30,
    '요금이 입력 영상 길이에 비례한다. 1초당 480p $0.318 / 720p $0.681, 초 단위 올림. unit_cost_krw 는 30초 480p 기준이라 레퍼런스 길이가 다르면 맞지 않는다'
);


INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, duration_seconds, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'genjutsu-school-crowd',
    '교복 군무 뮤비 속 주인공',
    '학생들이 줄지어 군무를 추는 영상에 내 얼굴을 넣어요. 주변 학생과 배경도 바꿀 수 있어요. 원본 영상 출처는 Higgsfield예요.',
    'VIDEO',
    NULL,
    'HIDDEN', 0,
    -- 임시값이다. DB 가 PAID 에 0 을 허용하지 않아 비워둘 수 없었을 뿐, 정해진 값이 아니다.
    -- 기존 이미지 템플릿의 암묵적 비율(원가 302원 / 기본 100프롬비)을 30초 480p 원가
    -- 14,200원에 적용해 어림한 수다. 한 번 돌려 실제 원가를 보고 다시 정해야 한다.
    'PAID', 5000,
    'DRAFT',
    '16:9',
    '2080x960',
    30,
    600,
    '바꿔 넣을 얼굴 사진 1장 (주변 학생과 배경은 선택)',
    '{"checklist":[
        "얼굴이 크고 또렷하게 나온 사진",
        "정면에 가까울수록 얼굴이 잘 유지돼요",
        "주변 학생이나 배경은 안 올려도 돼요 — 안 올리면 원본 그대로 나와요"
      ],
      "resultNote":"움직임과 카메라, 조명은 원본 영상 그대로예요. 올린 사진만 갈아 끼워요. 원본 영상 출처는 Higgsfield예요."}'::jsonb,
    FALSE,
    NULL
);

-- 같은 영상이 두 역할을 한다. 원본은 Genjutsu 에, 미리보기는 목록에.
INSERT INTO template_media (template_id, media_type, storage_key, preview_key, thumbnail_key, sort_order)
SELECT t.id,
       'VIDEO',
       'public-assets/reference-videos/genjutsu-sample-01.mp4',
       'public-assets/reference-videos/genjutsu-sample-01-preview.mp4',
       'public-assets/reference-videos/genjutsu-sample-01-poster.jpg',
       0
FROM templates t WHERE t.slug = 'genjutsu-school-crowd';

-- 사진 칸 셋. 주인공만 필수다.
INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '주인공', 'IMAGE', '주인공 사진',
       '가운데 흰 셔츠 인물이 이 사진의 얼굴로 바뀌어요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t WHERE t.slug = 'genjutsu-school-crowd';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '학생들', 'IMAGE', '주변 학생 (선택)',
       '안 올리면 원본 영상의 학생들이 그대로 나와요', FALSE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 2
FROM templates t WHERE t.slug = 'genjutsu-school-crowd';

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '배경', 'IMAGE', '배경 (선택)',
       '안 올리면 원본 영상의 학교 건물이 그대로 나와요', FALSE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 3
FROM templates t WHERE t.slug = 'genjutsu-school-crowd';

-- 해상도는 사용자가 고른다. 요금이 두 배 갈리는 값이라 기본은 싼 쪽이다.
INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '해상도', 'SELECT', '화질',
       '720p가 더 선명하지만 값이 두 배예요', TRUE,
       '["480p","720p"]'::jsonb, '{}'::jsonb, 4
FROM templates t WHERE t.slug = 'genjutsu-school-crowd';

INSERT INTO template_pipelines (template_id, version, active, steps, admin_memo)
SELECT
    t.id,
    1,
    TRUE,
    jsonb_build_array(
        jsonb_build_object(
            'type', 'GENERATE_VIDEO',
            'modelId', (SELECT id FROM ai_models
                         WHERE provider = 'HIGGSFIELD'
                           AND model_key = 'higgsfiled/genjutsu/motion-transfer/v1.0'),
            'prompt', $prompt$Rebuild this video using the reference images provided.

?@주인공 Replace the lead performer in the white shirt at the center with the person shown in @주인공. Keep their face clearly recognizable — same facial structure, eye shape, nose, mouth and proportions. Do not create a different person.
!@주인공 Keep the lead performer exactly as filmed.

?@학생들 Replace the uniformed students surrounding the lead with people resembling @학생들, keeping their uniforms and formation unchanged.
!@학생들 Keep the uniformed students exactly as filmed.

?@배경 Replace the school building and grounds behind the crowd with the setting shown in @배경, matching the original lighting and camera perspective.
!@배경 Keep the school building and grounds exactly as filmed.

Everything not mentioned above stays exactly as filmed — the choreography, the timing, the camera movement, the framing, the colour grading and the mood.
Do not change the number of people, their positions, or the order of shots.
Photorealistic. No cartoon or stylised rendering.$prompt$,
            'params', jsonb_build_object(
                'resolution', '{{해상도}}',
                -- 레퍼런스 영상. template_media 의 storage_key 와 같은 파일이다.
                'referenceVideo', 'public-assets/reference-videos/genjutsu-sample-01.mp4'
            ),
            'inputs', jsonb_build_object(
                '@주인공', '가운데 흰 셔츠 인물이 이 사진의 얼굴로 바뀌어요',
                '@학생들', '주변 학생들을 바꿀 때만',
                '@배경', '배경을 바꿀 때만'
            )
        )
    ),
    '레퍼런스 영상은 template_media 의 storage_key 를 쓴다. 30초 480p 약 14,200원 / 720p 약 30,400원. generate_cost 5000 프롬비는 임시값이며 실제 호출 원가를 보고 다시 정해야 한다. 공개 전 반드시 확인할 것. 아직 한 번도 돌려보지 않았다'
FROM templates t WHERE t.slug = 'genjutsu-school-crowd';
