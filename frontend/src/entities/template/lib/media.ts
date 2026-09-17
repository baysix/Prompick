/**
 * 이 URL을 video 태그로 재생할 수 있는지.
 *
 * 콘텐츠 타입이 VIDEO여도 예시 파일이 아직 정지 이미지일 수 있다. 그때 video 태그를 쓰면
 * 재생되지 않는 플레이어와 컨트롤만 남아 고장난 것처럼 보인다.
 */
export function isPlayableVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}
