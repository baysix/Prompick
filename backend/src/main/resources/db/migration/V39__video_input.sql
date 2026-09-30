-- ============================================================================
-- 영상 입력
--
-- Genjutsu 는 사진이 아니라 "이미 찍힌 영상"을 받는다. 그 영상의 움직임을 그대로 두고
-- 안의 인물이나 사물을 바꾼다.
--
-- 그래서 입력 칸에 VIDEO 가 필요하다. 그리고 업로드 표에는 길이를 적을 칸이 필요하다 —
-- 이 제공사의 요금은 결과가 아니라 <입력 영상의 길이>에 비례하기 때문이다. 30초짜리를
-- 올리면 720p 기준 한 번에 2만원이 넘는다. 길이를 모르면 얼마를 받을지 정할 수 없고,
-- 브라우저가 알려준 길이를 믿으면 그 숫자를 고치는 것만으로 우리 돈이 나간다.
-- ============================================================================

ALTER TABLE template_input_fields
    DROP CONSTRAINT IF EXISTS ck_input_field_type;

ALTER TABLE template_input_fields
    ADD CONSTRAINT ck_input_field_type
        CHECK (field_type IN ('IMAGE', 'VIDEO', 'SELECT', 'TEXT'));

-- 서버가 직접 재어 넣는다. 비어 있으면 아직 확인하지 않았다는 뜻이다.
ALTER TABLE uploads
    ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(8, 2);

COMMENT ON COLUMN uploads.duration_seconds IS
    '영상 길이(초). 서버가 파일에서 직접 읽는다 — 이 값이 요금이 되므로 클라이언트 말을 믿지 않는다';
