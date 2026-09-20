package com.prompick.request.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/** 추천 한 표. 한 사람이 한 요청에 한 번만 */
@Entity
@Table(name = "template_request_votes")
@IdClass(RequestVote.Key.class)
public class RequestVote {

    @Id
    @Column(name = "request_id")
    private Long requestId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected RequestVote() {}

    public RequestVote(Long requestId, Long userId) {
        this.requestId = requestId;
        this.userId = userId;
    }

    public Long getRequestId() {
        return requestId;
    }

    public Long getUserId() {
        return userId;
    }

    public static class Key implements Serializable {
        private Long requestId;
        private Long userId;

        public Key() {}

        public Key(Long requestId, Long userId) {
            this.requestId = requestId;
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key key)) return false;
            return Objects.equals(requestId, key.requestId) && Objects.equals(userId, key.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(requestId, userId);
        }
    }
}
