package tmmsystem.dto.production_plan;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RejectProductionPlanRequest {
    private String rejectionReason;
}
