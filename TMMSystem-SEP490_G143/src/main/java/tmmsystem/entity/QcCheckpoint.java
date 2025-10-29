package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "qc_checkpoint",
        indexes = { @Index(name = "idx_qc_checkpoint_stage_order", columnList = "stage_type, display_order") }
)
@Getter @Setter
public class QcCheckpoint {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_type", length = 20, nullable = false)
    private String stageType; // WARPING, WEAVING, DYEING, CUTTING, HEMMING, PACKAGING

    @Column(name = "checkpoint_name", length = 255, nullable = false)
    private String checkpointName;

    @Column(name = "inspection_criteria", columnDefinition = "text")
    private String inspectionCriteria;

    @Column(name = "sampling_plan", columnDefinition = "text")
    private String samplingPlan;

    @Column(name = "is_mandatory")
    private Boolean mandatory = true;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}


