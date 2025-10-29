package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Entity @Table(name = "work_order_detail")
@Getter @Setter
public class WorkOrderDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_order_detail_id")
    private ProductionOrderDetail productionOrderDetail;

    @Column(name = "stage_sequence")
    private Integer stageSequence; // 1=WARPING, 2=WEAVING, etc.

    @Column(name = "planned_start_at")
    private Instant plannedStartAt;

    @Column(name = "planned_end_at")
    private Instant plannedEndAt;

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "complete_at")
    private Instant completeAt;

    @Column(name = "work_status", length = 20)
    private String workStatus = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELED

    @Column(columnDefinition = "text")
    private String notes;
}


