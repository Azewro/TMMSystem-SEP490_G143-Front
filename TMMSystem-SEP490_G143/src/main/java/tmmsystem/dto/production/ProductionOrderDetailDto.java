package tmmsystem.dto.production;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class ProductionOrderDetailDto {
    private Long id;
    private Long productionOrderId;
    private Long productId;
    private Long bomId;
    private String bomVersion;
    private BigDecimal quantity;
    private String unit;
    private String noteColor;
}


