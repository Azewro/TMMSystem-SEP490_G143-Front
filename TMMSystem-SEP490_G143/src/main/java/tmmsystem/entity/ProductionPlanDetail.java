package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "production_plan_detail",
        indexes = {
                @Index(name = "idx_plan_detail_plan", columnList = "plan_id"),
                @Index(name = "idx_plan_detail_product", columnList = "product_id"),
                @Index(name = "idx_plan_detail_work_center", columnList = "work_center_id"),
                @Index(name = "idx_plan_detail_delivery_date", columnList = "required_delivery_date")
        }
)
@Getter
@Setter
public class ProductionPlanDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private ProductionPlan productionPlan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "planned_quantity", precision = 12, scale = 2, nullable = false)
    private BigDecimal plannedQuantity; // Số lượng cần sản xuất

    @Column(name = "required_delivery_date", nullable = false)
    private LocalDate requiredDeliveryDate; // Ngày giao hàng theo hợp đồng

    @Column(name = "proposed_start_date", nullable = false)
    private LocalDate proposedStartDate; // Ngày dự kiến bắt đầu sản xuất

    @Column(name = "proposed_end_date", nullable = false)
    private LocalDate proposedEndDate; // Ngày dự kiến hoàn thành

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_center_id")
    private Machine workCenter; // Dây chuyền hoặc máy phụ trách

    @Column(name = "expected_capacity_per_day", precision = 10, scale = 2)
    private BigDecimal expectedCapacityPerDay;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(columnDefinition = "text")
    private String notes;

    // One-to-many relationship với ProductionPlanStage
    @OneToMany(mappedBy = "planDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductionPlanStage> stages;
}
