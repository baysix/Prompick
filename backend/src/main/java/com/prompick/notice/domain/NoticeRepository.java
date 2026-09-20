package com.prompick.notice.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    /**
     * 사용자에게 보여줄 공지.
     *
     * <p>고정된 것이 먼저, 그다음은 내보낸 순서의 역순이다. 작성 중인 글은 나가지 않는다.
     */
    @Query("""
            select n from Notice n
             where n.publishedAt is not null
             order by n.pinned desc, n.publishedAt desc
            """)
    List<Notice> findPublished();

    /** 운영 화면용. 작성 중인 것까지 전부, 최근에 손댄 순서로 */
    List<Notice> findAllByOrderByIdDesc();
}
