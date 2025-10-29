package tmmsystem.dto.qc;

import lombok.Getter; import lombok.Setter;

import java.time.Instant;

@Getter @Setter
public class QcPhotoDto {
    private Long id;
    private Long qcInspectionId;
    private String photoUrl;
    private String caption;
    private Instant uploadedAt;
}


