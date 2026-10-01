import { api } from "@/shared/api/client";

/**
 * 약관 버전.
 *
 * 화면이 이 값을 받아 가입할 때 그대로 돌려보낸다. 서버는 자기가 들고 있는 값과 같은지
 * 확인한 뒤에야 가입을 받는다 — 화면을 열어둔 채로 약관이 바뀐 경우, 사용자가 본 문서와
 * 기록에 남는 버전이 어긋나는 것을 막기 위해서다.
 */
export type LegalVersions = {
  termsVersion: string;
  privacyVersion: string;
};

export const legalApi = {
  versions: () => api.get<LegalVersions>("/legal"),
};

export const legalKeys = {
  versions: () => ["legal", "versions"] as const,
};
