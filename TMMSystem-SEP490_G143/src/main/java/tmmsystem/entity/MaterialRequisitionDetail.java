package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Entity @Table(name = "material_requisition_detail")
@Getter @Setter
public class MaterialRequisitionDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requisition_id")
    private MaterialRequisition requisition;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id")
    private Material material;

    @Column(name = "quantity_requested", precision = 10, scale = 3, nullable = false)
    private BigDecimal quantityRequested;

    @Column(name = "quantity_approved", precision = 10, scale = 3)
    private BigDecimal quantityApproved;

    @Column(name = "quantity_issued", precision = 10, scale = 3)
    private BigDecimal quantityIssued;

    @Column(length = 20)
    private String unit = "KG";

    @Column(columnDefinition = "text")
    private String notes;
}


