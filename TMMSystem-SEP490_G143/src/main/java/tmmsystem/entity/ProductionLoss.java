package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "production_loss",
        indexes = {
                @Index(name = "idx_loss_po", columnList = "production_order_id"),
                @Index(name = "idx_loss_material_time", columnList = "material_id, recorded_at")
        }
)
@Getter @Setter
public class ProductionLoss {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_order_id")
    private ProductionOrder productionOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id")
    private Material material;

    @Column(name = "quantity_lost", precision = 10, scale = 3, nullable = false)
    private BigDecimal quantityLost;

    @Column(name = "loss_type", length = 20, nullable = false)
    private String lossType; // CANCELLATION, DEFECT, WASTE, SHRINKAGE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_stage_id")
    private ProductionStage productionStage;

    @Column(columnDefinition = "text")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private Instant recordedAt;
}


