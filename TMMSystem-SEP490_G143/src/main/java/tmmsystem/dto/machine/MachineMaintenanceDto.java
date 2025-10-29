package tmmsystem.dto.machine;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
public class MachineMaintenanceDto {
    private Long id;
    private Long machineId;
    private String maintenanceType;
    private String issueDescription;
    private String resolution;
    private Long reportedById;
    private Long assignedToId;
    private Instant reportedAt;
    private Instant startedAt;
    private Instant completedAt;
    private String status;
    private BigDecimal cost;
    private Integer downtimeMinutes;
}


