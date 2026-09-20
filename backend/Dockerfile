# =============================================================================
# 백엔드 컨테이너
#
# Render 무료 플랜은 512MB를 준다. JVM에게 넉넉한 크기가 아니라서, 기본 설정으로 올리면
# 부하가 조금만 걸려도 OutOfMemory 로 죽는다. 그래서 아래 실행 옵션이 중요하다.
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
RUN useradd --system --uid 1001 prompick
USER prompick

# Render 는 PORT 환경변수로 포트를 알려준다. 그 값을 그대로 쓴다.
ENV SERVER_PORT=10000
EXPOSE 10000

# 메모리 설정.
#
#   MaxRAMPercentage=70  컨테이너에 주어진 만큼의 70%를 힙으로 쓴다. 512MB면 약 358MB.
#                        나머지는 JVM 자체와 스레드 스택, 네이티브 메모리 몫이다. 이 여유를
#                        남기지 않으면 힙은 멀쩡한데 컨테이너가 통째로 강제 종료된다.
#   SerialGC             힙이 작을 때는 병렬 GC 의 부가 비용이 이득보다 크다. 스레드도 덜 쓴다.
#   TieredStopAtLevel=1  최적화 컴파일을 생략한다. 시작이 빨라지는 대신 최고 속도는 포기한다.
#                        무료 플랜은 15분마다 잠들어 다시 시작하므로, 오래 달릴 때의 속도보다
#                        빨리 깨어나는 쪽이 실제로 더 중요하다.
ENTRYPOINT ["java", \
    "-XX:MaxRAMPercentage=70", \
    "-XX:+UseSerialGC", \
    "-XX:TieredStopAtLevel=1", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
