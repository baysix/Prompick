package com.prompick.user.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentRepository extends JpaRepository<UserConsent, Long> {

    /** 이 회원의 동의 이력. 최근 것이 먼저 온다 */
    List<UserConsent> findByUserIdOrderByAgreedAtDescIdDesc(Long userId);
}
