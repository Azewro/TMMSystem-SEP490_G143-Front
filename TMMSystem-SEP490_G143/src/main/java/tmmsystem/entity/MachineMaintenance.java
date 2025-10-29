package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity @Table(name = "machine_maintenance",
        indexes = {
                @Index(name = "idx_machine_maintenance_time", columnList = "machine_id, reported_at"),
                @Index(name = "idx_machine_maintenance_status", columnList = "status")
        }
)
@Getter @Setter
public class MachineMaintenance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @Column(name = "maintenance_type", length = 20, nullable = false)
    private String maintenanceType; // SCHEDULED, BREAKDOWN, REPAIR, CALIBRATION

    @Column(name = "issue_description", columnDefinition = "text")
    private String issueDescription;

    @Column(name = "resolution", columnDefinition = "text")
    private String resolution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo; // technician

    @Column(name = "reported_at", nullable = false)
    private Instant reportedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(length = 20)
    private String status = "REPORTED"; // REPORTED, IN_PROGRESS, COMPLETED, CANCELED

    @Column(name = "cost", precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "downtime_minutes")
    private Integer downtimeMinutes;
}


