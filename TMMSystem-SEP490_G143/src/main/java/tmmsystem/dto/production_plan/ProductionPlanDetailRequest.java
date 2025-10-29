package tmmsystem.dto.production_plan;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ProductionPlanDetailRequest {
    private Long productId;
    private BigDecimal plannedQuantity;
    private LocalDate requiredDeliveryDate;
    private LocalDate proposedStartDate;
    private LocalDate proposedEndDate;
    private Long workCenterId;
    private BigDecimal expectedCapacityPerDay;
    private Integer leadTimeDays;
    private String notes;
    private List<ProductionPlanStageRequest> stages;
}
