package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "bom",
        indexes = {
                @Index(name = "idx_bom_product_active", columnList = "product_id, is_active"),
                @Index(name = "idx_bom_product_version_unique", columnList = "product_id, version", unique = true)
        }
)
@Getter @Setter
public class Bom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "version", length = 20, nullable = false)
    private String version;

    @Column(name = "version_notes", columnDefinition = "text")
    private String versionNotes;

    @Column(name = "is_active")
    private Boolean active = true; // only one active per product (enforce in service)

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "obsolete_date")
    private LocalDate obsoleteDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}


