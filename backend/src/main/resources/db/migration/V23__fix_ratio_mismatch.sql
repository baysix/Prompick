-- ============================================================================
-- 비율과 해상도가 어긋난 것을 맞춘다.
--
-- 미니미 템플릿은 1024x1536(=2:3)으로 만드는데 ratio 컬럼에는 1:1이 들어가 있었다. V13에서는
-- 2:3으로 넣었으니 그 뒤에 누군가 바꾼 것인데, 어디서 바뀌었는지는 확인하지 못했다.
--
-- 다만 바뀔 수 있었던 통로는 알 수 있다. 관리자 템플릿 폼의 비율 선택지에 2:3이 없었다.
-- 목록에 없는 값을 가진 템플릿을 그 폼으로 열어 저장하면, 원래 값이 조용히 다른 값으로
-- 덮인다. 선택지를 늘리는 것으로 그 통로를 막는다(프론트 쪽에서 함께 고쳤다).
--
-- 이 값은 사용자에게 "비율 1:1"로 보이고 탐색 필터에도 쓰인다. 실제로 나오는 그림과 다른
-- 정보를 보여주고 있었던 셈이다.
-- ============================================================================

-- 해상도가 적혀 있는 템플릿은 그 값에서 비율을 다시 계산해 맞춘다.
-- 해상도가 사실에 더 가깝다 — 실제로 그 크기로 만들어지기 때문이다.
UPDATE templates t
   SET ratio = sub.computed,
       updated_at = now()
  FROM (
      SELECT
          id,
          (w / g)::text || ':' || (h / g)::text AS computed
      FROM (
          SELECT
              id,
              split_part(resolution, 'x', 1)::int AS w,
              split_part(resolution, 'x', 2)::int AS h,
              gcd(split_part(resolution, 'x', 1)::int, split_part(resolution, 'x', 2)::int) AS g
          FROM templates
          WHERE resolution ~ '^[0-9]+x[0-9]+$'
      ) parsed
      WHERE g > 0
  ) sub
 WHERE t.id = sub.id
   AND t.ratio <> sub.computed;
