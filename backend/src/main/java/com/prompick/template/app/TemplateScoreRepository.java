package com.prompick.template.app;

import java.time.Instant;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * 인기 점수 갱신.
 *
 * <p>JPA 가 아니라 SQL 한 문장으로 한다. 템플릿을 전부 읽어 하나씩 세고 하나씩 저장하면
 * 템플릿 수만큼 왕복이 생기는데, 이 일은 데이터베이스 안에서 끝낼 수 있다.
 *
 * <p>제작 내역과 템플릿은 서로 다른 묶음(generation, template)에 속한다. 한쪽 엔티티가 다른
 * 쪽을 알게 두는 대신, 이 표 하나를 읽는 SQL 만 여기 둔다.
 */
@Repository
public class TemplateScoreRepository {

    private final JdbcClient jdbc;

    public TemplateScoreRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * 모든 템플릿의 점수를 다시 센다.
     *
     * <p>성공한 제작만 센다. 실패한 작업은 사용자에게 돌려준 일이지 인기의 증거가 아니다.
     *
     * <p>제작 내역이 하나도 없는 템플릿도 0 으로 맞춘다. 그러지 않으면 예전 점수가 남아, 아무도
     * 만들지 않게 된 템플릿이 계속 윗자리를 차지한다.
     *
     * <p>카드에 보이는 "만든 사람 N명"(generation_count)도 같이 맞춘다. 이 칸 역시 아무도
     * 갱신하지 않아, 제작이 세 번 있었는데도 0명으로 보이는 템플릿이 있었다. 같은 원본에서
     * 세는 값이니 따로 둘 이유가 없다.
     *
     * @param since 이 시각 이후의 제작을 "최근"으로 본다
     * @param recentWeight 최근 한 건을 평생 한 건의 몇 배로 칠지
     * @return 점수가 실제로 바뀐 템플릿 수
     */
    public int recompute(Instant since, int recentWeight) {
        return jdbc.sql(
                        """
                        UPDATE templates t
                           SET trend_score = c.score,
                               generation_count = c.made
                          FROM (
                                SELECT tpl.id,
                                       -- j.id IS NULL 을 먼저 거른다. LEFT JOIN 은 제작이 없는
                                       -- 템플릿에도 NULL 행을 하나 만드는데, 그 행에서
                                       -- created_at >= since 는 NULL 이라 ELSE 로 떨어져
                                       -- 0점이어야 할 템플릿이 1점을 받는다.
                                       COALESCE(SUM(
                                           CASE WHEN j.id IS NULL              THEN 0
                                                WHEN j.created_at >= :since    THEN :weight
                                                ELSE 1
                                           END
                                       ), 0) AS score,
                                       COUNT(j.id) AS made
                                  FROM templates tpl
                                  LEFT JOIN generation_jobs j
                                         ON j.template_id = tpl.id
                                        AND j.status = 'SUCCEEDED'
                                 GROUP BY tpl.id
                               ) c
                         WHERE t.id = c.id
                           AND (t.trend_score IS DISTINCT FROM c.score
                             OR t.generation_count IS DISTINCT FROM c.made)
                        """)
                .param("since", java.sql.Timestamp.from(since))
                .param("weight", recentWeight)
                .update();
    }
}
