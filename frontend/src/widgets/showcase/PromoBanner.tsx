import { ButtonLink } from "@/shared/ui/Button";

/**
 * 맺음 배너.
 *
 * 결과물을 다 보고 내려온 사람에게 마지막으로 길을 알려주는 자리다. 첫 화면에 크게 두면
 * 정작 보러 온 결과물을 한 번 더 스크롤해야 만나게 되어, 여기 아래에 둔다.
 *
 * 사진 대신 격자무늬를 깐 것은, 이 자리에 놓을 사진이 곧 결과물이라 위와 겹쳐서다.
 */
export function PromoBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-surface/50">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff14 1px, transparent 1px), linear-gradient(to bottom, #ffffff14 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 70% at 50% 50%, #000 20%, transparent 100%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center gap-6 px-6 py-10 sm:px-10">
        <div className="min-w-0 flex-1">
          <p className="text-[22px] font-bold leading-tight tracking-[-0.04em] text-ink sm:text-[28px]">
            사진 한 장이면 시작할 수 있어요
          </p>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-soft">
            무료 템플릿은 하루 세 번까지 그냥 만들어 볼 수 있어요. 실패하면 횟수를 다시
            채워드려요.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonLink href="/explore?pricing=FREE" size="lg">
            무료로 만들어 보기
          </ButtonLink>
          <ButtonLink href="/pricing" variant="secondary" size="lg">
            프롬비가 뭔가요
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
