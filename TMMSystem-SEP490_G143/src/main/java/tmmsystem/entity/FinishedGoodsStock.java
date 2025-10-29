package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "finished_goods_stock",
        indexes = {
                @Index(name = "idx_fg_stock_product_location", columnList = "product_id, location"),
                @Index(name = "idx_fg_stock_product_grade", columnList = "product_id, quality_grade")
        }
)
@Getter @Setter
public class FinishedGoodsStock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(length = 20)
    private String unit = "UNIT";

    @Column(length = 100)
    private String location;

    @Column(name = "batch_number", length = 50)
    private String batchNumber;

    @Column(name = "production_date")
    private LocalDate productionDate;

    @Column(name = "quality_grade", length = 20)
    private String qualityGrade = "A"; // A, B, C, DEFECT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qc_inspection_id")
    private QcInspection qcInspection;

    @UpdateTimestamp
    @Column(name = "last_updated_at")
    private Instant lastUpdatedAt;
}


