package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Entity @Table(name = "bom_detail")
@Getter @Setter
public class BomDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bom_id")
    private Bom bom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id")
    private Material material;

    @Column(name = "quantity", precision = 10, scale = 3, nullable = false)
    private BigDecimal quantity;

    @Column(length = 20)
    private String unit = "KG";

    @Column(name = "stage", length = 20)
    private String stage; // WEAVING, DYEING, etc.

    @Column(name = "is_optional")
    private Boolean optional = false;

    @Column(columnDefinition = "text")
    private String notes;
}


