package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity @Table(name = "technical_sheet",
        uniqueConstraints = { @UniqueConstraint(columnNames = {"sheet_number"}) },
        indexes = { @Index(name = "idx_techsheet_po_unique", columnList = "production_order_id", unique = true) }
)
@Getter @Setter
public class TechnicalSheet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_order_id")
    private ProductionOrder productionOrder;

    @Column(name = "sheet_number", length = 50, nullable = false)
    private String sheetNumber; // TECH-YYYYMMDD-XXX

    @Column(name = "yarn_specifications", columnDefinition = "json")
    private String yarnSpecifications;

    @Column(name = "machine_settings", columnDefinition = "json")
    private String machineSettings;

    @Column(name = "quality_standards", columnDefinition = "json")
    private String qualityStandards;

    @Column(name = "special_instructions", columnDefinition = "text")
    private String specialInstructions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy; // Technical Department

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


