-- ============================================================================
-- 여섯 번째 템플릿: 90년대 어린이 잡지 표지
--
-- 비율은 3:4로 잡았다. 잡지 표지가 대체로 그 근처이고, 9:16처럼 길면 위아래 여백이 남아
-- 제목과 기사 목록을 배치할 자리가 어색해진다.
--
-- 받은 글에서 두 군데만 손댔다.
--   1. "업로드한 사진" -> @아이사진   (이 표시가 있어야 사진이 실제로 전달된다)
--   2. "maaazine" -> "magazine"       (오타. 그대로 두면 모델이 읽을 단어가 하나 줄어든다)
--
-- ♥♥ 는 받은 그대로 두었다. 아이 이름을 넣을 자리로 보이지만, 직접 확인하지 않은 추측으로
-- 남의 프롬프트를 고치지는 않는다. 이름을 받고 싶으면 입력 칸을 하나 더 두고 {{이름}} 으로
-- 바꾸면 된다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'retro-kids-magazine',
    '90년대 어린이 잡지 표지',
    '아이 사진을 그 시절 어린이 잡지 표지처럼 꾸며요. 제목, 기사 목록, 특별부록까지 들어가요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '3:4',
    '1152x1536',
    180,
    '아이 사진 1장',
    '{"checklist":[
        "얼굴이 크게 나온 사진",
        "표지 인물처럼 정면을 보는 사진이 잘 어울려요",
        "배경이 단순한 사진일수록 글자가 잘 얹혀요",
        "상반신까지 나오면 구도가 더 자연스러워요"
      ],
      "resultNote":"제목과 문구는 매번 조금씩 다르게 나와요. 얼굴과 표정은 그대로 유지돼요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아이사진', 'IMAGE', '아이사진',
       '표지 인물이 되니 얼굴이 크고 또렷한 사진이 좋아요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'retro-kids-magazine';

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
            'prompt', $prompt$@아이사진 을 1990년대 한국 어린이 잡지 표지 스타일로 편집

[중요]
- 인물 유지 (얼굴/표정/포즈 변경 금지)
- 실제 잡지처럼 사진 위에 텍스트, 그래프 자연스럽게 배치

[텍스트 구성]
- 메인타이틀 : "♥♥ KIDS" (두껍고 둥근 레트로 폰트, 상단 크게)
- 상단문구 : "♥♥는 오늘도 레전드"
- 서브타이틀:
"가정의 달 특집"
"오월은 어린이날 ♥♥ 세상"
포인트
별 배지: "⚡귀여움 과다 주의보"
말풍선: "🚨비상🚨 모두들 ♥♥ 매력 조심"

[좌측리스트]
- 오늘도 저지레 끝판왕 엄마 혈압 상승📈
- 말은 오지게 안 들어도 귀여우니 됐다!
- 얼마나 귀여운지 감도 안온다

[하단/기타]
스티커: "헬로♥♥ 스티커 30장"
사선 띠: "⭐장꾸력폭발⭐ 엄빠 정신 혼미 주의"

특별부록
- ♥♥ 브로마이드
- 헬로♥♥ 스티커
- 침 한가득 뽀뽀

[스타일]
90년대 키즈 잡지, 컬러풀, 별/ 꽃/ 스티커 그래픽
빈티지 질감 ( 하프톤, 필름 그레인 바랜 색감)

vintage korean kids
magazine cover, 1990s
retro, colorful typography$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '3:4',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아이사진', '표지 인물이 되니 얼굴이 크고 또렷한 사진이 좋아요')
        )
    ),
    '한 단계. 글자가 많이 들어가는 표지라 배치 해석이 필요해 responses 경로를 쓴다'
FROM templates t
WHERE t.slug = 'retro-kids-magazine';
