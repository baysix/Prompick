# =============================================================================
# 백엔드 컨테이너
#
# Lightsail 4GB 한 대에 이 컨테이너와 프론트, Caddy 가 함께 산다. compose 가 이 컨테이너에
# 1.5GB 를 떼어 주고, 그 안에서 JVM 이 얼마를 쓸지는 아래 실행 옵션이 정한다.
#
# 예전에는 512MB(Render 무료) 안에 욱여넣느라 힙을 조이고 최적화 컴파일까지 껐다. 이제는
# 그럴 이유가 없다 — 서버가 잠들지 않으므로, 빨리 깨어나는 것보다 오래 달릴 때의 속도가
# 중요해졌다.
# =============================================================================

# --- 빌드 ---------------------------------------------------------------------
# 빌드에만 쓰는 단계다. 여기서 만든 결과물(jar)만 다음 단계로 넘기고 나머지는 버린다.
# JDK 전체와 Gradle 캐시를 최종 이미지에 담으면 수백 MB가 그냥 늘어난다.
FROM gradle:jdk25 AS build

WORKDIR /app

# 의존성 목록만 먼저 넣는다. 소스만 바뀐 배포에서는 이 층이 캐시에 남아 빌드가 훨씬 빠르다.
COPY build.gradle settings.gradle ./
RUN gradle dependencies --no-daemon --quiet || true

COPY src ./src
RUN gradle bootJar --no-daemon --quiet

# --- 실행 ---------------------------------------------------------------------
FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# 루트로 돌리지 않는다. 컨테이너가 뚫렸을 때 할 수 있는 일을 줄인다.
# 힙 덤프를 쓸 자리도 미리 만들어 둔다 — 죽고 나서 만들 수는 없다.
RUN useradd --system --uid 1001 prompick \
    && mkdir -p /app/dumps && chown prompick /app/dumps
USER prompick

# Caddy 가 이 포트로 넘겨준다. 바깥에는 열리지 않는다.
ENV SERVER_PORT=8080
EXPOSE 8080

# 메모리 설정.
#
#   MaxRAMPercentage=70  컨테이너 몫(1.5GB)의 70%를 힙으로 쓴다 — 약 1GB.
#                        나머지 30%는 JVM 자체와 스레드 스택, 네이티브 메모리 몫이다.
#                        이 여유를 남기지 않으면 힙은 멀쩡한데 컨테이너가 통째로 죽는다.
#   UseG1GC              힙이 1GB쯤 되면 SerialGC 의 멈춤이 눈에 띄기 시작한다. G1 은 멈춤을
#                        잘게 쪼개므로 제작 중에 응답이 뚝 끊기는 일이 줄어든다.
#   HeapDumpOnOutOfMemoryError
#                        죽을 때 무엇이 메모리를 잡고 있었는지 남긴다. 이것이 없으면 "가끔
#                        죽는다"는 사실만 알고 원인은 영영 모른다.
ENTRYPOINT ["java", \
    "-XX:MaxRAMPercentage=70", \
    "-XX:+UseG1GC", \
    "-XX:+HeapDumpOnOutOfMemoryError", \
    "-XX:HeapDumpPath=/app/dumps", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
