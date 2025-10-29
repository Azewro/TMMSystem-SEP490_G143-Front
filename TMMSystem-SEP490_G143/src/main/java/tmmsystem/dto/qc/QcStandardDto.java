package tmmsystem.dto.qc;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class QcStandardDto {
    private Long id;
    private String standardName;
    private String standardCode;
    private String description;
    private String applicableStages;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}


