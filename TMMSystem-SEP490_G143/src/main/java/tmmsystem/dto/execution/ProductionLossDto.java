package tmmsystem.dto.execution;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
public class ProductionLossDto {
    private Long id;
    private Long productionOrderId;
    private Long materialId;
    private BigDecimal quantityLost;
    private String lossType;
    private Long productionStageId;
    private String notes;
    private Long recordedById;
    private Instant recordedAt;
}


