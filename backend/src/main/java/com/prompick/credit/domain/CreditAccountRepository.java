package com.prompick.credit.domain;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CreditAccountRepository extends JpaRepository<CreditAccount, Long> {

    /**
     * 잔액을 바꾸기 위해 잠그고 읽는다.
     *
     * <p>잠그지 않으면 같은 사람이 두 창에서 동시에 제작을 눌렀을 때 둘 다 잔액을 확인하고
     * 둘 다 통과한다. 100원 남은 지갑으로 200원을 쓰게 된다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from CreditAccount a where a.userId = :userId")
    Optional<CreditAccount> findForUpdate(@Param("userId") Long userId);
}
