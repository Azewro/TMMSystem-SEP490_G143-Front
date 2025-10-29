package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "product",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"code"})
        },
        indexes = {
                @Index(name = "idx_product_category_active", columnList = "category_id, is_active"),
                @Index(name = "idx_product_code_unique", columnList = "code", unique = true)
        }
)
@Getter @Setter
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "code", length = 50, nullable = false)
    private String code; // TWL-30x50-WHT

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @Column(length = 20)
    private String unit = "UNIT";

    @Column(name = "standard_weight", precision = 10, scale = 3)
    private BigDecimal standardWeight;

    @Column(name = "standard_dimensions", length = 100)
    private String standardDimensions;

    @Column(name = "base_price", precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "is_active")
    private Boolean active = true;
}


