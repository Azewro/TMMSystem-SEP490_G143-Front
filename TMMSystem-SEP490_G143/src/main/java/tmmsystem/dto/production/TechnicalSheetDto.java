package tmmsystem.dto.production;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class TechnicalSheetDto {
    private Long id;
    private Long productionOrderId;
    private String sheetNumber;
    private String yarnSpecifications;
    private String machineSettings;
    private String qualityStandards;
    private String specialInstructions;
    private Long createdById;
    private Long approvedById;
    private Instant createdAt;
    private Instant updatedAt;
}


