package com.prompick.user.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByAuthUserId(UUID authUserId);

    boolean existsByNickname(String nickname);
}
