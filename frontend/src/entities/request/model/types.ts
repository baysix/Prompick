/** 요청 게시판 타입 */

export type RequestStatus = "PENDING" | "REVIEWING" | "BUILDING" | "DONE" | "REJECTED";

export interface TemplateRequest {
  id: number;
  title: string;
  referenceUrl: string | null;
  description: string | null;
  status: RequestStatus;
  statusLabel: string;
  voteCount: number;
  /** 내가 이미 추천했는지 */
  votedByMe: boolean;
  authorNickname: string;
  /** 내가 올린 요청인지 */
  mine: boolean;
  /** 완성됐다면 만들어진 템플릿 주소 */
  templateSlug: string | null;
  adminNote: string | null;
  createdAt: string;
}

/** 아직 끝나지 않은 요청인지 */
export function isOpen(status: RequestStatus) {
  return status === "PENDING" || status === "REVIEWING" || status === "BUILDING";
}
