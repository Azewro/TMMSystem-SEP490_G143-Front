package tmmsystem.dto.qc;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class QcCheckpointDto {
    private Long id;
    private String stageType;
    private String checkpointName;
    private String inspectionCriteria;
    private String samplingPlan;
    private Boolean isMandatory;
    private Integer displayOrder;
    private Instant createdAt;
    private Instant updatedAt;
}


