package com.prompick.ai.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderCredentialRepository extends JpaRepository<ProviderCredential, Long> {

    Optional<ProviderCredential> findByProvider(Provider provider);

    List<ProviderCredential> findAllByOrderByProviderAsc();
}
