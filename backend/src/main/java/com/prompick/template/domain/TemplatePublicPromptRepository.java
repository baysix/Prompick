package com.prompick.template.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TemplatePublicPromptRepository extends JpaRepository<TemplatePublicPrompt, Long> {

    Optional<TemplatePublicPrompt> findByTemplateId(Long templateId);
}
