package tmmsystem.dto.production_plan;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProductionPlanRequest {
    private String planCode;
    private String notes;
}
