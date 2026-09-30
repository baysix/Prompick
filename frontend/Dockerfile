# =============================================================================
# 프론트 컨테이너
#
# Next 는 빌드할 때 NEXT_PUBLIC_* 값을 코드 안에 박아 넣는다. 실행할 때 읽는 것이 아니라
# 빌드할 때 글자로 치환되는 것이라, 주소가 바뀌면 다시 빌드해야 한다. 그래서 이 값들은
# ENV 가 아니라 ARG 로 받는다.
#
# 반대로 API_BASE_URL(서버 사이드용)은 실행할 때 읽으므로 compose 의 environment 로 넘긴다.
# =============================================================================

# --- 의존성 -------------------------------------------------------------------
# package.json 만 먼저 넣는다. 소스만 바뀐 배포에서는 이 층이 캐시에 남아 npm ci 를 건너뛴다.
FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- 빌드 ---------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 브라우저가 쓸 값들. 빌드 결과물에 글자 그대로 박힌다.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# 빌드 중에 수집 요청을 보내지 않는다.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- 실행 ---------------------------------------------------------------------
FROM node:22-alpine AS run

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

# 루트로 돌리지 않는다. 컨테이너가 뚫렸을 때 할 수 있는 일을 줄인다.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# standalone 은 실행에 필요한 것만 추려 담는다. static 과 public 은 따로 붙여야 한다 —
# 추적 대상이 아니라서 standalone 안에 들어가지 않는다.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
