package tmmsystem.entity;

import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Entity @Table(name = "production_order_detail")
@Getter @Setter
public class ProductionOrderDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "production_order_id")
    private ProductionOrder productionOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    // Lock BOM version
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bom_id")
    private Bom bom;

    @Column(name = "bom_version", length = 20)
    private String bomVersion;

    @Column(name = "quantity", precision = 10, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(length = 20)
    private String unit = "UNIT";

    @Column(name = "note_color", length = 100)
    private String noteColor;
}


