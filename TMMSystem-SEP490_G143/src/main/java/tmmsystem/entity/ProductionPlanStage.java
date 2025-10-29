package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_plan_stage",
        indexes = {
                @Index(name = "idx_plan_stage_detail", columnList = "plan_detail_id"),
                @Index(name = "idx_plan_stage_type", columnList = "stage_type"),
                @Index(name = "idx_plan_stage_machine", columnList = "assigned_machine_id"),
                @Index(name = "idx_plan_stage_user", columnList = "in_charge_user_id"),
                @Index(name = "idx_plan_stage_sequence", columnList = "plan_detail_id, sequence_no")
        }
)
@Getter
@Setter
public class ProductionPlanStage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_detail_id")
    private ProductionPlanDetail planDetail;

    @Column(name = "stage_type", length = 20, nullable = false)
    private String stageType; // Công đoạn sản xuất (WARPING, WEAVING, DYEING, CUTTING, HEMMING, PACKAGING)

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo; // Thứ tự công đoạn trong quy trình

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_machine_id")
    private Machine assignedMachine; // Máy được gợi ý/đề xuất

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "in_charge_user_id")
    private User inChargeUser; // Người phụ trách công đoạn

    @Column(name = "planned_start_time", nullable = false)
    private LocalDateTime plannedStartTime;

    @Column(name = "planned_end_time", nullable = false)
    private LocalDateTime plannedEndTime;

    @Column(name = "min_required_duration_minutes")
    private Integer minRequiredDurationMinutes; // Thời lượng tối thiểu hệ thống tính

    @Column(name = "transfer_batch_quantity", precision = 10, scale = 2)
    private BigDecimal transferBatchQuantity; // Số lượng chuyển batch giữa công đoạn

    @Column(name = "capacity_per_hour", precision = 10, scale = 2)
    private BigDecimal capacityPerHour; // Năng suất/giờ của máy tại công đoạn

    @Column(columnDefinition = "text")
    private String notes;
}
