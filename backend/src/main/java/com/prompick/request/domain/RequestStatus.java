package com.prompick.request.domain;

/** 요청이 지금 어디까지 왔는지. 올린 사람이 이 값만 보고도 기다릴지 말지 판단할 수 있어야 한다 */
public enum RequestStatus {
    /** 올라왔고 아직 보지 않음 */
    PENDING,
    /** 만들 수 있는지 살펴보는 중 */
    REVIEWING,
    /** 만들고 있음 */
    BUILDING,
    /** 완성. 어느 템플릿이 되었는지 이어진다 */
    DONE,
    /** 반려. 왜인지 반드시 남긴다 */
    REJECTED;

    public String displayName() {
        return switch (this) {
            case PENDING -> "접수됨";
            case REVIEWING -> "살펴보는 중";
            case BUILDING -> "만드는 중";
            case DONE -> "완성";
            case REJECTED -> "어려워요";
        };
    }

    /** 아직 끝나지 않은 요청인지. 목록에서 기본으로 보여줄 것을 고를 때 쓴다 */
    public boolean isOpen() {
        return this == PENDING || this == REVIEWING || this == BUILDING;
    }
}
