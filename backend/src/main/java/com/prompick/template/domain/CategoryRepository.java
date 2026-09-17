package com.prompick.template.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<Category> findByActiveTrueAndContentTypeOrderBySortOrderAscIdAsc(ContentType contentType);
}
