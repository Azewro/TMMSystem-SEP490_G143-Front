package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "outsourcing_task",
        indexes = {
                @Index(name = "idx_outsourcing_stage", columnList = "production_stage_id"),
                @Index(name = "idx_outsourcing_status", columnList = "status")
        }
)
@Getter @Setter
public class OutsourcingTask {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_stage_id")
    private ProductionStage productionStage;

    @Column(name = "vendor_name", length = 255, nullable = false)
    private String vendorName;

    @Column(name = "delivery_note_number", length = 50)
    private String deliveryNoteNumber;

    @Column(name = "weight_sent", precision = 10, scale = 3)
    private BigDecimal weightSent;

    @Column(name = "weight_returned", precision = 10, scale = 3)
    private BigDecimal weightReturned;

    @Column(name = "shrinkage_rate", precision = 5, scale = 2)
    private BigDecimal shrinkageRate;

    @Column(name = "expected_quantity", precision = 10, scale = 2)
    private BigDecimal expectedQuantity;

    @Column(name = "returned_quantity", precision = 10, scale = 2)
    private BigDecimal returnedQuantity;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "expected_return_date")
    private LocalDate expectedReturnDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @Column(length = 20)
    private String status = "SENT"; // SENT, IN_PROGRESS, RETURNED, QUALITY_ISSUE

    @Column(columnDefinition = "text")
    private String notes;

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


