package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "material_stock",
        indexes = {
                @Index(name = "idx_mat_stock_material_location", columnList = "material_id, location"),
                @Index(name = "idx_mat_stock_material_batch", columnList = "material_id, batch_number")
        }
)
@Getter @Setter
public class MaterialStock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id")
    private Material material;

    @Column(name = "quantity", precision = 10, scale = 3, nullable = false)
    private BigDecimal quantity;

    @Column(length = 20)
    private String unit = "KG";

    @Column(name = "unit_price", precision = 12, scale = 2)
    private BigDecimal unitPrice; // Giá nhập của batch này

    @Column(length = 100)
    private String location;

    @Column(name = "batch_number", length = 50)
    private String batchNumber;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @UpdateTimestamp
    @Column(name = "last_updated_at")
    private Instant lastUpdatedAt;
}


