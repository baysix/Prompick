package com.prompick.template.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TemplatePipelineRepository extends JpaRepository<TemplatePipeline, Long> {

    List<TemplatePipeline> findByTemplateIdOrderByVersionDesc(Long templateId);

    Optional<TemplatePipeline> findByTemplateIdAndActiveTrue(Long templateId);

    @Query("select coalesce(max(p.version), 0) from TemplatePipeline p where p.templateId = :templateId")
    int findMaxVersion(@Param("templateId") Long templateId);
}
