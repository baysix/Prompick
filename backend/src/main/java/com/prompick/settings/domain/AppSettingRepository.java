package com.prompick.settings.domain;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 운영 설정 조회.
 *
 * <p>{@code findAll} 을 쓰지 않는다. 이유는 {@link AppSetting} 의 설명에 있다.
 */
public interface AppSettingRepository extends JpaRepository<AppSetting, String> {}
