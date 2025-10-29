package tmmsystem.dto.execution;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter @Setter
public class MaterialRequisitionDto {
    private Long id;
    private String requisitionNumber;
    private Long productionStageId;
    private Long requestedById;
    private Long approvedById;
    private String status;
    private Instant requestedAt;
    private Instant approvedAt;
    private Instant issuedAt;
    private String notes;
    private List<MaterialRequisitionDetailDto> details;
}


