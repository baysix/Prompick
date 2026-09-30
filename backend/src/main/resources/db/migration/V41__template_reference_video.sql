-- ============================================================================
-- 레퍼런스 영상을 템플릿의 값으로 옮긴다
--
-- 처음에는 template_media 에 넣었다. 둘 다 메인에서 재생된다는 점이 같아서였는데, 그것은
-- 편의였지 설계가 아니었다. 두 가지는 정반대다.
--
--   예시 결과물    이 템플릿이 만들어내는 것   (결과)
--   레퍼런스 영상  이 템플릿이 바탕으로 쓰는 것 (입력)
--
-- 한 목록에 섞어두면 나중에 진짜 결과 영상을 예시로 올렸을 때 어느 것이 무엇인지 구분할 수
-- 없게 된다. 그리고 레퍼런스는 템플릿마다 하나뿐이다 — 여러 개일 수 없고, 바뀌면 제작 결과가
-- 통째로 달라진다. 그런 값은 목록이 아니라 컬럼이다.
-- ============================================================================

ALTER TABLE templates
    ADD COLUMN IF NOT EXISTS reference_video_key   VARCHAR(500),
    ADD COLUMN IF NOT EXISTS reference_preview_key VARCHAR(500),
    ADD COLUMN IF NOT EXISTS reference_poster_key  VARCHAR(500);

COMMENT ON COLUMN templates.reference_video_key IS
    '제작의 바탕이 되는 영상. 영상을 다시 짓는 모델(Genjutsu 등)이 이것을 받는다';
COMMENT ON COLUMN templates.reference_preview_key IS
    '목록에서 자동재생할 가벼운 영상. 원본을 목록에서 틀면 타일 하나에 수십 MB가 나간다';
COMMENT ON COLUMN templates.reference_poster_key IS
    '영상이 뜨기 전에 보일 첫 장면';

-- V40 에서 예시 자리에 넣어둔 레퍼런스 영상을 제자리로 옮긴다.
UPDATE templates t
   SET reference_video_key   = m.storage_key,
       reference_preview_key = m.preview_key,
       reference_poster_key  = m.thumbnail_key
  FROM template_media m
 WHERE m.template_id = t.id
   AND t.slug = 'genjutsu-school-crowd';

DELETE FROM template_media
 WHERE template_id = (SELECT id FROM templates WHERE slug = 'genjutsu-school-crowd');

-- 파이프라인에 손으로 박아둔 경로도 뺀다. 이제 실행기가 템플릿에서 읽어간다.
UPDATE template_pipelines p
   SET steps = (
        SELECT jsonb_agg(
                 CASE
                   WHEN step ? 'params'
                   THEN jsonb_set(step, '{params}', (step -> 'params') - 'referenceVideo')
                   ELSE step
                 END
                 ORDER BY ordinality)
          FROM jsonb_array_elements(p.steps) WITH ORDINALITY AS a(step, ordinality)
       )
 WHERE p.template_id = (SELECT id FROM templates WHERE slug = 'genjutsu-school-crowd');
