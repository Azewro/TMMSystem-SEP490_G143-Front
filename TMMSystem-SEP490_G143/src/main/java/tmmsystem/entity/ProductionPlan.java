package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "production_plan",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"plan_code"})
        },
        indexes = {
                @Index(name = "idx_production_plan_contract", columnList = "contract_id"),
                @Index(name = "idx_production_plan_status", columnList = "status"),
                @Index(name = "idx_production_plan_created_by", columnList = "created_by"),
                @Index(name = "idx_production_plan_approved_by", columnList = "approved_by")
        }
)
@Getter
@Setter
public class ProductionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id")
    private Contract contract; // Liên kết hợp đồng đã được duyệt

    @Column(name = "plan_code", length = 50, nullable = false)
    private String planCode; // Mã kế hoạch, ví dụ PP-2025-001

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private PlanStatus status = PlanStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy; // Người lập kế hoạch (Planner)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy; // Người phê duyệt (Director)

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approval_notes", columnDefinition = "text")
    private String approvalNotes;

    // One-to-many relationship với ProductionPlanDetail
    @OneToMany(mappedBy = "productionPlan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProductionPlanDetail> details;

    public enum PlanStatus {
        DRAFT,           // Nháp
        PENDING_APPROVAL, // Chờ phê duyệt
        APPROVED,        // Đã phê duyệt
        REJECTED         // Từ chối
    }
}
