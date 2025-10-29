package tmmsystem.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class MachineDto {
    private Long id;
    private String code;
    private String name;
    private String type;
    private String status;
    private String location;
    private String specifications;
    private Instant lastMaintenanceAt;
    private Instant nextMaintenanceAt;
    private Integer maintenanceIntervalDays;
    private Instant createdAt;
    private Instant updatedAt;
}


