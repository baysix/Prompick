# 프롬픽

인스타·쇼츠에서 유행하는 AI 영상·이미지의 **프롬프트를 모아둔 아카이브**이자,
사진 한 장만 올리면 **대신 만들어 주는** 플랫폼.

- 📄 **프롬프트 제공** — 원문과 사용법을 그대로 받아 직접 만든다
- ⚡ **자동 제작** — 가이드대로 사진을 올리면 결과물이 나온다
- 🪙 재화 단위: **프롬비**

기획 확정사항은 [docs/01-기획-확정사항.md](docs/01-기획-확정사항.md)를 본다. (원본 PRD보다 우선한다)

---

## 구성

```
backend/    Spring Boot 4.1.1 · Java 25 · JPA · Flyway
frontend/   Next.js 16 · TypeScript · Tailwind 4 · TanStack Query
docs/       기획·설계 문서

Supabase    Postgres · Auth(카카오·구글) · Storage
```

## 준비물

| | 상태 |
|---|---|
| JDK 25 | 필요 (설치됨) |
| Node.js 20+ | 필요 (설치됨) |
| Supabase 프로젝트 | 필요 |
| Docker | **불필요** |
| Redis | **불필요** (추후 도입) |

## 처음 실행하기

### 1. Supabase 준비

1. 프로젝트를 만든다 (리전은 Seoul 권장)
2. Storage에 버킷 3개를 만든다
   - `uploads` — 비공개. 사용자가 올린 원본 사진
   - `outputs` — 비공개. 생성 결과물
   - `public-assets` — 공개. 템플릿 예시·가이드 이미지
3. Authentication > Providers 에서 Google, Kakao를 켠다

### 2. 백엔드

```bash
cd backend
cp .env.example .env     # Supabase URL·키·DB 접속정보를 채운다
./gradlew bootRun
```

- API: http://localhost:8080/api/v1
- API 문서(Swagger): http://localhost:8080/docs
- 헬스체크: http://localhost:8080/api/v1/health

### 3. 프론트엔드

```bash
cd frontend
cp .env.local.example .env.local
npm run dev
```

- http://localhost:3000

홈 화면의 초록 점이 켜지면 프론트 ↔ 백엔드 연결이 확인된 것이다.

---

## 개발 단계

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 기반 (프로젝트 뼈대, DB, 공통 에러, Swagger) | 진행 중 |
| 1 | 템플릿 조회 (홈·탐색·상세, 프롬프트 공개/비공개) | |
| 2 | 관리자 템플릿·파이프라인 관리 | |
| 3 | 인증 (카카오·구글 로그인) | |
| 4 | 자동 제작 (업로드, 워커, Mock 제공사) | |
| 5 | 프롬비 원장, 무료 횟수 제한 | |
| 6 | 결제 (포트원 V2) | |
| 7 | 실제 AI 연동, 트렌드 배치, 운영 기능 | |

---

## 지켜야 할 규칙

1. **파이프라인은 절대 사용자에게 노출하지 않는다.** 공개용 `public_prompt`와 실행용 `pipeline`은
   테이블부터 분리한다. 사용자용 DTO와 관리자용 DTO도 클래스 단위로 분리한다.
2. **프론트엔드는 Supabase DB에 직접 접근하지 않는다.** 프론트가 Supabase로 하는 일은 로그인뿐이다.
   `supabase.from(...)` 같은 DB 조회를 쓰면 파이프라인이 노출될 수 있다.
3. **`service_role` 키는 서버에만 둔다.** `NEXT_PUBLIC_` 변수에 넣지 않는다.
4. **외부 AI API는 백엔드에서만 호출한다.**
5. **프롬비 잔액은 원장(ledger) 없이 바꾸지 않는다.** 모든 증감은 기록을 남긴다.
6. **시크릿은 `.env`에만 둔다.** 커밋하지 않는다.
7. **파일은 DB에 넣지 않는다.** `storageKey`만 저장한다.
