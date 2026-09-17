package com.prompick.generation.domain;

public enum JobStatus {
    /** 만들어졌고 워커를 기다리는 중 */
    QUEUED,
    /** 워커가 단계를 실행하는 중 */
    RUNNING,
    SUCCEEDED,
    FAILED,
    CANCELED;

    public boolean isFinished() {
        return this == SUCCEEDED || this == FAILED || this == CANCELED;
    }
}
