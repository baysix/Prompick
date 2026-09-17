package com.prompick.template.api.dto;

import com.prompick.template.domain.ContentType;

public record CategoryResponse(String slug, String name, ContentType contentType) {}
