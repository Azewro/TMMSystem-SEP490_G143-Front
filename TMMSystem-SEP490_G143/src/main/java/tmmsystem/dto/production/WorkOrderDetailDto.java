package tmmsystem.dto.production;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class WorkOrderDetailDto {
    private Long id;
    private Long workOrderId;
    private Long productionOrderDetailId;
    private Integer stageSequence;
    private Instant plannedStartAt;
    private Instant plannedEndAt;
    private Instant startAt;
    private Instant completeAt;
    private String workStatus;
    private String notes;
}


