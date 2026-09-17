package com.prompick.template.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateMediaRepository extends JpaRepository<TemplateMedia, Long> {

    List<TemplateMedia> findByTemplateIdOrderBySortOrderAscIdAsc(Long templateId);
}
