-- 예시 결과물 연결.
--
-- 지금 올라간 파일은 개발용 자리표시 이미지다. 운영자가 관리자 화면에서 실제로 만든
-- 결과물을 등록하면 이 행을 대체한다.
--
-- preview_key(자동재생용 저용량 영상)는 아직 없다. 프론트는 preview_key가 없으면
-- 썸네일을 정지 이미지로 보여주므로 화면이 깨지지 않는다.

INSERT INTO template_media (template_id, media_type, storage_key, preview_key, thumbnail_key, sort_order)
SELECT
    t.id,
    t.content_type,
    'public-assets/templates/' || t.slug || '/example.svg',
    NULL,
    'public-assets/templates/' || t.slug || '/example.svg',
    0
FROM templates t
WHERE t.slug IN (
    'floating-product-ad',
    'melting-dessert-closeup',
    'studio-product-shot',
    'cinematic-brand-film',
    'film-camera-portrait'
);
