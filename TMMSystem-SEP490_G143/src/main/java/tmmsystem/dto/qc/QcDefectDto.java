package tmmsystem.dto.qc;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class QcDefectDto {
    private Long id;
    private Long qcInspectionId;
    private String defectType;
    private String defectDescription;
    private BigDecimal quantityAffected;
    private String severity;
    private String actionTaken;
}


