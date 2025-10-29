package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Entity @Table(name = "qc_defect")
@Getter @Setter
public class QcDefect {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "qc_inspection_id")
    private QcInspection qcInspection;

    @Column(name = "defect_type", length = 30, nullable = false)
    private String defectType; // COLOR_DEVIATION, WEIGHT_ISSUE, DIMENSION_ERROR, SURFACE_DEFECT

    @Column(name = "defect_description", columnDefinition = "text")
    private String defectDescription;

    @Column(name = "quantity_affected", precision = 10, scale = 2)
    private BigDecimal quantityAffected;

    @Column(name = "severity", length = 20, nullable = false)
    private String severity; // MINOR, MAJOR, CRITICAL

    @Column(name = "action_taken", length = 20)
    private String actionTaken; // REWORK, SCRAP, DOWNGRADE, APPROVED_WITH_DEVIATION
}


