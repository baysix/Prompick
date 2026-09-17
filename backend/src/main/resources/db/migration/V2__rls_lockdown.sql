-- ============================================================================
-- Supabase 접근 차단 (프롬프트 보호의 핵심)
--
-- Supabase는 anon key만 있으면 브라우저에서 테이블을 직접 조회할 수 있다.
-- 우리 서비스는 파이프라인(내부 프롬프트·모델·파라미터)이 새면 사업 가치가 사라진다.
-- 따라서 public 스키마 전체를 기본 차단하고, 모든 데이터는 백엔드를 통해서만 나가게 한다.
--
-- 규칙:
--   1. 프론트엔드는 Supabase DB에 직접 접근하지 않는다. 항상 Spring 백엔드를 거친다.
--   2. anon / authenticated 롤은 어떤 테이블도 읽지 못한다.
--   3. 백엔드는 postgres 또는 전용 DB 유저로 붙는다. (RLS를 우회하는 소유자 권한)
--   4. service_role 키는 서버에만 둔다. NEXT_PUBLIC_ 변수로 내보내지 않는다.
-- ============================================================================

DO $$
BEGIN
    -- Supabase 환경에서만 존재하는 롤이다. 로컬 PostgreSQL에서는 건너뛴다.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon';
        EXECUTE 'REVOKE USAGE ON SCHEMA public FROM anon';
        -- 앞으로 만들어질 테이블에도 같은 차단을 적용한다.
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated';
        EXECUTE 'REVOKE USAGE ON SCHEMA public FROM authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
    END IF;
END
$$;

-- 권한 차단에 더해 RLS도 켠다. 정책을 하나도 만들지 않았으므로 전량 거부가 된다.
--
-- 주의: FORCE ROW LEVEL SECURITY 는 쓰지 않는다.
-- FORCE를 켜면 테이블 소유자에게도 정책이 적용되는데, 정책이 하나도 없으므로
-- 백엔드까지 자기 테이블을 못 읽게 된다. ENABLE만 켜면 소유자는 통과하고
-- anon / authenticated 롤만 막힌다.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE app_settings IS
    '운영 설정값. RLS 전량 거부. 백엔드를 통해서만 접근한다.';
