package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "material_transaction",
        indexes = {
                @Index(name = "idx_mat_txn_material_time", columnList = "material_id, created_at"),
                @Index(name = "idx_mat_txn_ref", columnList = "reference_type, reference_id")
        }
)
@Getter @Setter
public class MaterialTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id")
    private Material material;

    @Column(name = "transaction_type", length = 10, nullable = false)
    private String transactionType; // IN, OUT, ADJUST

    @Column(name = "quantity", precision = 10, scale = 3, nullable = false)
    private BigDecimal quantity; // positive for IN, negative for OUT

    @Column(length = 20)
    private String unit = "KG";

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "batch_number", length = 50)
    private String batchNumber;

    @Column(length = 100)
    private String location;

    @Column(columnDefinition = "text")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;
}


