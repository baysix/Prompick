package com.prompick.template.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplateInputFieldRepository extends JpaRepository<TemplateInputField, Long> {

    List<TemplateInputField> findByTemplateIdOrderBySortOrderAscIdAsc(Long templateId);
}
