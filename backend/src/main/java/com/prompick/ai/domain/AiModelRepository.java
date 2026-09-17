package com.prompick.ai.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiModelRepository extends JpaRepository<AiModel, Long> {

    List<AiModel> findByOrderBySortOrderAscIdAsc();

    List<AiModel> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<AiModel> findByActiveTrueAndCapabilityOrderBySortOrderAscIdAsc(Capability capability);
}
