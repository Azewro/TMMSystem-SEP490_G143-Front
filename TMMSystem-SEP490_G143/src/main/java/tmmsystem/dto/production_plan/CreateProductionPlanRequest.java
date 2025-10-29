package tmmsystem.dto.production_plan;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateProductionPlanRequest {
    private Long contractId;
    private String planCode;
    private List<ProductionPlanDetailRequest> details;
    private String notes;
}