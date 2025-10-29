package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "material",
        uniqueConstraints = { @UniqueConstraint(columnNames = {"code"}) },
        indexes = {
                @Index(name = "idx_material_type_active", columnList = "type, is_active"),
                @Index(name = "idx_material_code_unique", columnList = "code", unique = true)
        }
)
@Getter @Setter
public class Material {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "code", length = 50, nullable = false)
    private String code;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @Column(name = "type", length = 20, nullable = false)
    private String type; // RAW_COTTON, YARN, DYE, CHEMICAL, PACKAGING

    @Column(name = "unit", length = 20)
    private String unit = "KG";

    @Column(name = "reorder_point", precision = 10, scale = 3)
    private java.math.BigDecimal reorderPoint;

    @Column(name = "standard_cost", precision = 12, scale = 2)
    private java.math.BigDecimal standardCost;

    @Column(name = "is_active")
    private Boolean active = true;
}


