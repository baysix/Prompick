/**
 * 가이드 글 목록.
 *
 * 본문은 각 페이지가 직접 들고 있고 여기에는 목록에 필요한 것만 둔다. 본문까지 데이터로
 * 만들면 작은 CMS를 하나 더 짓는 셈이 되는데, 글이 셋뿐인 지금은 그게 손해다.
 *
 * 새 글을 쓰면 여기에 한 줄 추가한다. 목록과 푸터가 이 배열을 함께 본다.
 */
export type GuideMeta = {
  slug: string;
  title: string;
  /** 목록에 보이는 한 줄. 검색 결과에도 그대로 쓰인다 */
  summary: string;
  /** 읽는 데 걸리는 시간(분). 눌러도 되는지 판단하는 데 쓴다 */
  minutes: number;
};

export const GUIDES: GuideMeta[] = [
  {
    slug: "photos",
    title: "어떤 사진을 올려야 잘 나올까",
    summary:
      "결과물의 절반은 올리는 사진에서 정해져요. 얼굴 각도, 빛, 해상도 — 무엇이 결과를 가르는지 정리했어요.",
    minutes: 5,
  },
  {
    slug: "results",
    title: "같은 사진인데 결과가 매번 다른 이유",
    summary:
      "두 번 만들면 두 번 다르게 나와요. 고장이 아니라 원래 그런 것이고, 알고 나면 쓰는 법이 달라져요.",
    minutes: 4,
  },
  {
    slug: "prompts",
    title: "프롬프트를 받아 가서 쓰는 법",
    summary:
      "공개된 프롬프트는 복사해서 다른 도구에 넣을 수 있어요. 그대로 넣으면 왜 다르게 나오는지도 함께 적었어요.",
    minutes: 4,
  },
];

export function findGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
