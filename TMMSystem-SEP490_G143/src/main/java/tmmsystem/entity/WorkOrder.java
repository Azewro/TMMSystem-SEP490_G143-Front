package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity @Table(name = "work_order",
        uniqueConstraints = { @UniqueConstraint(columnNames = {"wo_number"}) },
        indexes = {
                @Index(name = "idx_wo_po", columnList = "production_order_id"),
                @Index(name = "idx_wo_status", columnList = "status")
        }
)
@Getter @Setter
public class WorkOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_order_id")
    private ProductionOrder productionOrder;

    @Column(name = "wo_number", length = 50, nullable = false)
    private String woNumber;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(length = 30)
    private String status = "DRAFT";

    @Column(name = "send_status", length = 20)
    private String sendStatus = "NOT_SENT"; // NOT_SENT, SENT_TO_FLOOR

    @Column(name = "is_production")
    private Boolean production = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}


