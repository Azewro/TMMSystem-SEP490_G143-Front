package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "finished_goods_transaction",
        indexes = {
                @Index(name = "idx_fg_txn_product_time", columnList = "product_id, created_at"),
                @Index(name = "idx_fg_txn_ref", columnList = "reference_type, reference_id")
        }
)
@Getter @Setter
public class FinishedGoodsTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "transaction_type", length = 10, nullable = false)
    private String transactionType; // RECEIVE, SHIP, ADJUST, TRANSFER

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(length = 20)
    private String unit = "UNIT";

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "batch_number", length = 50)
    private String batchNumber;

    @Column(length = 100)
    private String location;

    @Column(name = "quality_grade", length = 20)
    private String qualityGrade;

    @Column(columnDefinition = "text")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}


