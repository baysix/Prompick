package com.prompick.report.domain;

/** 신고가 지금 어디까지 왔는지. 올린 사람이 이 값만 보고도 답을 기다릴지 판단할 수 있어야 한다 */
public enum BugReportStatus {
    /** 접수됨. 아직 보지 않음 */
    OPEN,
    /** 재현했음. 고쳐야 할 문제가 맞다 */
    CONFIRMED,
    /** 고쳤음 */
    FIXED,
    /** 오류가 아니었음. 왜인지 반드시 남긴다 */
    NOT_A_BUG,
    /** 이미 들어온 신고 */
    DUPLICATE;

    public String displayName() {
        return switch (this) {
            case OPEN -> "접수됨";
            case CONFIRMED -> "확인됨";
            case FIXED -> "고쳤어요";
            case NOT_A_BUG -> "오류가 아니에요";
            case DUPLICATE -> "이미 들어온 신고";
        };
    }

    /** 아직 손대야 하는 신고인지. 운영 화면이 기본으로 보여줄 것을 고를 때 쓴다 */
    public boolean isOpen() {
        return this == OPEN || this == CONFIRMED;
    }
}
