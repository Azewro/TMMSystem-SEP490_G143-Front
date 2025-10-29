package tmmsystem.dto.production;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
public class ProductionStageDto {
    private Long id;
    private Long workOrderDetailId;
    private String stageType;
    private Integer stageSequence;
    private Long machineId;
    private Long assignedToId;
    private Long assignedLeaderId;
    private String batchNumber;
    private BigDecimal plannedOutput;
    private BigDecimal actualOutput;
    private Instant startAt;
    private Instant completeAt;
    private String status;
    private Boolean isOutsourced;
    private String outsourceVendor;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}


