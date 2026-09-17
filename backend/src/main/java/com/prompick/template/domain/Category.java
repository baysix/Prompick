package com.prompick.template.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 50, unique = true)
    private String slug;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Category() {}

    public Long getId() {
        return id;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public boolean isActive() {
        return active;
    }
}
