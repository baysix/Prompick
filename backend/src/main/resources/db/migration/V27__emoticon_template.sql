-- ============================================================================
-- 세 번째 템플릿: 우리 아기 이모티콘
--
-- 한 장 안에 표정 12~16개를 격자로 그린다. 해상도를 1536x1536으로 잡은 이유가 여기 있다.
-- 1024로 만들면 4x4 격자에서 얼굴 하나가 256px밖에 되지 않아 눈·코·입이 뭉개진다. 이 템플릿은
-- "얼굴 특징을 그대로 살려달라"가 핵심이므로 칸마다 쓸 화소가 있어야 한다.
--
-- 한국어 글자가 들어간다. 이미지 모델이 한글을 정확히 그리는 것은 아직 장담하기 어려워서,
-- 결과를 보고 글자가 깨지면 프롬프트에서 글자를 빼거나 영어로 바꾸는 판단이 필요하다.
-- 그 판단은 운영자가 결과를 보고 해야 하므로, 일단 요청받은 그대로 넣는다.
-- ============================================================================

INSERT INTO templates (
    slug, title, description, content_type, category_id,
    prompt_access, prompt_cost, generate_access, generate_cost,
    status, ratio, resolution, estimated_seconds,
    required_photo_summary, upload_guide, pinned, published_at
) VALUES (
    'baby-emoticon-pack',
    '우리 아기 이모티콘',
    '아기 얼굴 그대로, 표정만 바꾼 이모티콘 세트를 한 장에 만들어요. 카톡에 쓰는 그 느낌이에요.',
    'IMAGE',
    NULL,
    'HIDDEN', 0,
    'FREE', 0,
    'PUBLISHED',
    '1:1',
    '1536x1536',
    180,
    '아기 얼굴이 또렷한 사진 1장',
    '{"checklist":[
        "얼굴이 정면으로 크게 나온 사진",
        "눈·코·입이 가려지지 않은 사진",
        "밝은 곳에서 찍은 사진일수록 표정이 살아나요",
        "모자나 손으로 얼굴이 가리지 않은 사진"
      ],
      "resultNote":"표정 12~16개가 한 장에 격자로 담겨요. 글자는 매번 조금씩 다르게 나올 수 있어요."}'::jsonb,
    TRUE,
    now()
);

INSERT INTO template_input_fields
    (template_id, field_key, field_type, label, help_text, required, options, validation, sort_order)
SELECT t.id, '아기사진', 'IMAGE', '아기사진',
       '얼굴이 정면으로 크게 나온 사진일수록 표정이 잘 살아나요', TRUE,
       '[]'::jsonb, '{"minWidth":200,"minHeight":200}'::jsonb, 1
FROM templates t
WHERE t.slug = 'baby-emoticon-pack';

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
            'prompt', $prompt$귀여운 신생아 아기 얼굴을 활용한 카카오톡 이모티콘 스타일 이미지 만들어줘. 깨끗한 배경.

총 12~16개의 다양한 표정:
웃음, 울음, 졸림, 놀람, 멍함, 먹는 모습, 짱 그림, 사랑스러운 표정 등

각 표정마다 귀여운 한국어 텍스트 추가:
예: 안녕!, 응?, 헤헷!, 졸려요~, 힝 ㅠㅠ, 우와!, 좋아요!, 쳇!, 크앙!, 냠냠~, 멍~, 반짝!

스타일:
- 스티커처럼 흰 테두리
- 부드러운 색감
- 미니 이모지(하트, 물방울, 별 등) 포함
- 전체를 한 장에 그리드 형태로 배치
- 실사 기반 + 귀엽고 따뜻한 느낌

@아기사진 을 기반으로 얼굴 특징을 그대로 살려서 만들어줘.
눈, 코, 입 위치와 얼굴형은 최대한 유지하고 표정만 다양하게 바꿔줘.$prompt$,
            'params', jsonb_build_object(
                'api', 'responses',
                'mainlineModel', 'gpt-5.4',
                'size', '1536x1536',
                'quality', 'high'
            ),
            'inputs', jsonb_build_object('@아기사진', '얼굴이 정면으로 크게 나온 사진일수록 표정이 잘 살아나요')
        )
    ),
    '한 단계. 격자 16칸이라 1536x1536으로 잡았다. 1024면 칸마다 얼굴이 뭉개진다'
FROM templates t
WHERE t.slug = 'baby-emoticon-pack';
