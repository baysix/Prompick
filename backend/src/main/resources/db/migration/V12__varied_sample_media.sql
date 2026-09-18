-- 개발용 자리표시 이미지를 다양한 것으로 바꾼다.
--
-- 지금까지 쓰던 것은 모두 같은 구도(네모 + 타원)라, 격자로 깔면 같은 그림이 반복되는 것처럼
-- 보였다. 실제 결과물은 구도·색·밀도가 제각각이고 그 차이가 화면을 살린다.
-- 인물·풍경·제품·추상 네 갈래로 20종을 만들어 두고 템플릿마다 다른 것을 쓰게 한다.

UPDATE template_media m
   SET storage_key   = 'public-assets/samples/sample-' || (m.template_id % 20) || '.svg',
       thumbnail_key = 'public-assets/samples/sample-' || (m.template_id % 20) || '.svg'
 WHERE m.storage_key LIKE 'public-assets/templates/%';

-- 템플릿마다 예시를 여러 장 갖게 한다. 상세 화면의 슬라이드와 첫 화면 격자가
-- 한 장짜리로는 채워지지 않는다.
INSERT INTO template_media (template_id, media_type, storage_key, preview_key, thumbnail_key, sort_order)
SELECT t.id,
       t.content_type,
       'public-assets/samples/sample-' || ((t.id * 3 + s) % 20) || '.svg',
       NULL,
       'public-assets/samples/sample-' || ((t.id * 3 + s) % 20) || '.svg',
       s
FROM templates t
CROSS JOIN generate_series(1, 3) AS s
WHERE t.status = 'PUBLISHED';
