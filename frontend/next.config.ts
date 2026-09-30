import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * 서버에 올릴 때 필요한 것만 추려서 내보낸다.
   *
   * 이게 없으면 node_modules 전체(1GB 안팎)를 이미지에 담아야 한다. standalone 은 실제로
   * 쓰이는 코드만 추적해 200MB 대로 줄여준다. 4GB 짜리 서버에서 이미지를 직접 빌드하므로
   * 이 차이가 배포 시간과 디스크에 그대로 나타난다.
   */
  output: "standalone",

  /*
   * 뒤에 Caddy 가 있다. 접속자의 진짜 IP 와 프로토콜은 Caddy 가 헤더로 넘겨준다.
   * 이것을 켜두지 않으면 Next 가 모든 요청을 컨테이너 내부 주소에서 온 것으로 본다.
   */
  poweredByHeader: false,
};

export default nextConfig;
