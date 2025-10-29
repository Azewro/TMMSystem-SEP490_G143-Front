package tmmsystem.dto.production_plan;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ProductionPlanStageDto {
    private Long id;
    private Long planDetailId;
    private String stageType;
    private String stageTypeName; // Display name for stage type
    private Integer sequenceNo;
    private Long assignedMachineId;
    private String assignedMachineName;
    private String assignedMachineCode;
    private Long inChargeUserId;
    private String inChargeUserName;
    private LocalDateTime plannedStartTime;
    private LocalDateTime plannedEndTime;
    private Integer minRequiredDurationMinutes;
    private BigDecimal transferBatchQuantity;
    private BigDecimal capacityPerHour;
    private String notes;
    
    // Calculated fields
    private Long durationMinutes;
    private BigDecimal estimatedOutput;
}
